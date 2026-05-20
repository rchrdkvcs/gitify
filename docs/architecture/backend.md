# Architecture backend

## Routes

```
# Public
GET  /docs                        → Scalar UI (OpenAPI interactive)
GET  /auth/github/redirect        → Redirige vers GitHub OAuth
GET  /auth/github/callback        → Callback OAuth, crée la session
GET  /projects/showcase           → Vitrine publique

# Protégées — middleware.auth() requis (cookie adonis-session)
GET    /auth/me                   → Profil utilisateur courant
DELETE /auth/logout               → Déconnexion
PUT    /auth/preferences          → Mise à jour des préférences

GET  /projects/feed               → Fil personnalisé
GET  /projects/liked              → Projets aimés (paginé)
GET  /projects/:id                → Détail d'un projet
POST /projects/:id/like           → Liker un projet
POST /projects/:id/pass           → Passer un projet
```

---

## Flux d'une requête

```
Client HTTP
    │
    ▼
Router (start/routes.ts)
    │  openapi.registerRoutes("/docs") — enregistre la route Scalar
    │  middleware.auth() sur les groupes protégés
    ▼
Middlewares globaux (start/kernel.ts)
    │  force_json_response — force Content-Type: application/json
    │  container_bindings  — injections IoC
    ▼
Controller
    │  request.validateUsing(validator) — valide les paramètres
    │  auth.getUserOrFail() / auth.user! — récupère l'utilisateur
    │  appelle le service métier
    ▼
Service
    ├─ AuthService — User.updateOrCreate depuis driverUser GitHub
    ├─ ProjectFeedService — orchestration du fil, interactions, showcase
    └─ GitHubSyncService → GitHubApiClient — ingestion GitHub → DB
    ▼
Model Lucid
    │  requêtes PostgreSQL via Knex (ORM Lucid)
    ▼
Réponse JSON
```

---

## Authentification

### Flux OAuth

```
1. GET /auth/github/redirect
   ally.use("github").redirect()
   → Redirige le navigateur vers github.com/login/oauth/authorize

2. GET /auth/github/callback?code=...
   ally.use("github").user()
   → Échange le code contre un access token
   → Récupère email, name, avatarUrl, login, emailVerificationState

   AuthService.findOrCreateFromGitHub(driverUser)
   → User.updateOrCreate({ email }, { name, avatarUrl, githubAccessToken, isVerified })
   → Crée ou met à jour l'utilisateur à chaque connexion
      (le token OAuth est toujours à jour)

   auth.use("web").login(user)
   → Crée la session AdonisJS
   → Pose le cookie adonis-session (HTTP-Only, SameSite=Lax)

   response.redirect(FRONTEND_URL)
```

### Protection des routes

`middleware.auth()` appelle `ctx.auth.authenticateUsing()`. Si la session est invalide ou absente, AdonisJS retourne automatiquement une réponse 401. L'utilisateur est alors disponible via `auth.user` ou `auth.getUserOrFail()` dans le controller.

### Mode développement (`ENABLE_DEV_TOKEN=true`)

Quand cette variable est activée (jamais en production) :

- Un second cookie non-HttpOnly est posé en parallèle du cookie de session
- `GET /auth/dev` retourne le token en JSON

Cela permet de copier le token dans Bruno ou Postman pour tester les routes protégées sans passer par le navigateur.

---

## Sérialisation des réponses

`providers/api_provider.ts` injecte la méthode `serialize` dans chaque `HttpContext`.

### Comportement

`ApiSerializer` étend `BaseSerializer` avec `wrap = "data"` — `serialize(data)` enveloppe le résultat sous `{ data: ... }`.

Pour les endpoints qui retournent un objet directement (sans clé englobante), `serialize.withoutWrapping(data)` bypasse ce wrapping.

```typescript
// Retourne { data: { id, email, ... } } → jamais utilisé en pratique pour les objets directs
return serialize(transformer);

// Retourne { id, email, ... } directement → utilisé pour GET /auth/me
return serialize.withoutWrapping(UserTransformer.transform(user));

// Retourne { message: "...", user: { id, email, ... } } → clé manuelle + withoutWrapping pour le sous-objet
return response.ok({
  message: "Preferences updated successfully",
  user: serialize.withoutWrapping(UserTransformer.transform(user)),
});
```

### `UserTransformer`

Hérite de `BaseTransformer<User>`. Expose uniquement les champs nécessaires via `this.pick(...)` — **`githubAccessToken` est exclu**.

```typescript
return this.pick(this.resource, [
  "id",
  "email",
  "name",
  "avatarUrl",
  "isVerified",
  "preferences",
  "createdAt",
  "updatedAt",
]);
```

---

## Pipeline d'ingestion GitHub

### Vue d'ensemble

Gitify adopte une ingestion **lazy** : les dépôts GitHub ne sont récupérés que quand la base locale ne contient pas assez de projets pour satisfaire une requête. Il n'y a pas de cron — le fetch est déclenché au moment de la demande utilisateur.

### `GitHubApiClient` — couche HTTP

Encapsule tous les appels à l'API GitHub.

**`searchRepositories(language, difficulty, token, perPage)`**

Construit la requête Search API selon la difficulté :

| Difficulté | Filtre                                                                       |
| ---------- | ---------------------------------------------------------------------------- |
| `beginner` | `language:{lang} archived:false is:public good-first-issues:>0`              |
| `expert`   | `language:{lang} archived:false is:public stars:>1000 help-wanted-issues:>0` |

Trie par étoiles décroissant, récupère jusqu'à 100 résultats. Filtre les dépôts où `has_issues: false || open_issues_count === 0` (GitHub inclut les PRs dans ce compteur).

**`getProjectDetails(ownerName, repoName, token)`**

5 appels GitHub en parallèle :

| Endpoint                                                | Donnée                                       |
| ------------------------------------------------------- | -------------------------------------------- |
| `GET /repos/{o}/{r}/readme`                             | README décodé depuis base64 (UTF-8)          |
| `GET /repos/{o}/{r}/languages`                          | Répartition des langages en octets           |
| `GET /repos/{o}/{r}/contributors?per_page=10`           | Top 10 contributeurs (type `User` seulement) |
| `GET /repos/{o}/{r}/releases/latest`                    | Tag de la dernière release                   |
| `GET /repos/{o}/{r}/contributors?per_page=1&anon=false` | Total via header `Link`                      |

Le total de contributeurs est extrait du header `Link` (pattern `page=N>; rel="last"`) — évite de paginer toute la liste.

### `GitHubSyncService` — orchestration et cache

**`needsFetch(language, difficulty)`**

Consulte `github_fetch_caches`. Retourne `true` si aucune entrée n'existe ou si `fetched_at` est vieux de plus de **24 heures** (`config/gitify.ts → cache.fetchTtlHours`).

**`fetchAndStore(language, difficulty, token, perPage?)`**

1. Appelle `GitHubApiClient.searchRepositories`
2. Filtre les repos sans vraies issues
3. Upsert chaque repo via `Project.updateOrCreate({ githubRepoId })`
4. Met à jour `github_fetch_caches` pour ce couple `(language, difficulty)`

**`needsDetailsFetch(project)`**

Retourne `true` si `details_fetched_at` est null ou vieux de plus de **7 jours** (`cache.detailsCacheDays`).

**`fetchProjectDetails(project, token)`**

Enrichit le projet avec readme, languages, contributors, latestRelease, totalContributorsCount. Upsert les contributors via `Contributor.updateOrCreate({ projectId, githubUserId })`.

---

## `ProjectFeedService` — logique métier

### `getFeed(userId, preferences, token)`

```
1. Charge tous les projectId vus (liked + passed) par l'utilisateur
2. Compte les projets disponibles (matching prefs, non vus)
3. Si disponibles < fetchThreshold (25) :
   → Pour chaque langage : si needsFetch → fetchAndStore
4. Pour chaque langage : récupère jusqu'à perLanguageLimit (60) projets
5. Round-robin entre les langages → max totalLimit (60) projets
6. Retourne { projects, available }
```

**Round-robin** : entremêle les résultats par langage index-par-index. Si l'utilisateur a sélectionné TypeScript + Python, le résultat sera `[ts1, py1, ts2, py2, ...]`. Cela évite qu'un langage dominant monopolise le début du fil.

### `getShowcase(serverToken?)`

Pour chacun des 12 langages configurés :

1. Charge les 30 meilleurs projets en base (triés par étoiles) avec leurs 2 premiers contributeurs
2. Si le pool < 4 projets **et** un token serveur est disponible → `fetchAndStore` en fire-and-forget (sans bloquer la réponse)
3. Sélectionne aléatoirement 6 projets dans le pool

### `getProject(id, token)`

1. `Project.find(id)`
2. Si `needsDetailsFetch` → `fetchProjectDetails` (peut être lent, ~500ms)
3. Charge les contributors via `project.load("contributors")`

### `getLikedProjects(userId, page)`

Pagine les `user_project_interactions` de type `liked`, triées par `createdAt` desc, avec preload du projet associé. 20 éléments par page.

### `recordInteraction(userId, projectId, type)`

`UserProjectInteraction.updateOrCreate({ userId, projectId }, { type })` — un like peut remplacer un pass et vice-versa.

---

## OpenAPI

Configuré dans `config/openapi.ts`. Les décorateurs TypeScript sur les controllers et les DTOs alimentent la spec OpenAPI 3.x à l'exécution.

- **Scalar UI** : `GET /docs`
- **Sécurité** : schéma `cookie` (apiKey dans le cookie `adonis-session`)
- **DTOs** : `app/schemas/user_schemas.ts` + `app/schemas/project_schemas.ts`
- **Exclusions** : `GET /auth/github/redirect` et `GET /auth/github/callback` sont marqués `@ApiExcludeOperation()`

Les tags `Auth`, `Preferences`, `Projects` sont déclarés dans la config pour ordonner la documentation.
