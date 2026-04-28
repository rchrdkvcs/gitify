# TECHNICAL ARCHITECTURE - GitMatch

## 1. Tech Stack

- **Monorepo:**
  - `apps/api`: AdonisJS 7 (Node.js) + TypeScript.
  - `apps/web`: Nuxt 4 (Vue.js) + TypeScript + TailwindCSS.
- **Database:** PostgreSQL 15.
- **Infrastructure:** Docker Compose.
- **Package Manager:** `pnpm`.
- **API Client:** [Tuyau](https://tuyau.julr.dev/) — type-safe client auto-generated from AdonisJS routes.

## 2. Backend (AdonisJS 7)

- **Pattern:** MVC.
- **Testing:** **Japa** (Adonis built-in).
- **Auth:** Adonis Ally (GitHub OAuth 2.0) + AdonisJS native **session** stored in an HTTP-Only cookie.

### Flux d'authentification (Backend)

```
GET /auth/github/redirect   → redirige vers GitHub (Ally)
GET /auth/github/callback   → reçoit le code OAuth → upsert User → ouvre la session → redirige vers FRONTEND_URL
GET /auth/me                → retourne l'utilisateur connecté (session requise)
DELETE /auth/logout         → détruit la session
PUT  /auth/preferences      → met à jour difficulty + languages (session requise)
```

Routes protégées par `middleware.auth()` d'AdonisJS — toutes les routes `/projects/*` et `/auth/me`, `/auth/logout`, `/auth/preferences`.

## 3. Frontend (Nuxt 4)

- **Framework:** Vue 3 + Composition API (`<script setup>`).
- **State:** Pinia (`useAuthStore`).
- **HTTP Client:** `$fetch` natif Nuxt + client Tuyau (pour les appels typés).
- **Testing:** **Jest** (Unit/Component).
- **UI:** TailwindCSS.

### Architecture d'authentification (Frontend)

#### Composants clés

| Fichier                         | Rôle                                            |
| ------------------------------- | ----------------------------------------------- |
| `plugins/auth.ts`               | Initialise l'état auth au démarrage de l'app    |
| `stores/auth.ts`                | Pinia store — source de vérité de l'utilisateur |
| `middlewares/auth.ts`           | Redirige vers `/` si non authentifié            |
| `middlewares/guest.ts`          | Redirige vers `/` si déjà authentifié           |
| `composables/usePreferences.ts` | Gère le formulaire de préférences               |

#### Plugin d'initialisation (`plugins/auth.ts`)

Plugin **universel** (SSR + client). Il s'exécute une fois au démarrage de l'application Nuxt.

```
┌─ Requête SSR ──────────────────────────────────────────────────────┐
│  plugins/auth.ts                                                    │
│    ├─ authStore.user existe déjà ? → return (déjà hydraté)         │
│    └─ $fetch('/auth/me', { headers: cookie })                       │
│         ├─ 200 → authStore.user = user, isInitialized = true        │
│         └─ 401 → authStore.user = null, isInitialized = true        │
│                                                                     │
│  @pinia/nuxt sérialise l'état Pinia dans le payload Nuxt           │
└────────────────────────────────────────────────────────────────────┘

┌─ Hydratation client ───────────────────────────────────────────────┐
│  Pinia restaure l'état depuis le payload → authStore.user peuplé   │
│  plugins/auth.ts → guard `if (authStore.user) return` → 0 requête  │
└────────────────────────────────────────────────────────────────────┘

┌─ Navigation SPA (client-side) ─────────────────────────────────────┐
│  Pinia en mémoire → middlewares lisent isAuthenticated directement  │
└────────────────────────────────────────────────────────────────────┘
```

**Forwarding de cookies en SSR :** `useRequestHeaders(["cookie"])` est passé à `$fetch` uniquement côté serveur (`import.meta.server`), ce qui permet à AdonisJS d'identifier la session lors du rendu SSR. Côté client, le navigateur envoie automatiquement les cookies via `credentials: "include"`.

#### Store (`stores/auth.ts`)

```
useAuthStore
  ├─ user: Ref<Data.User | null>      — utilisateur connecté (null = anonyme)
  ├─ isAuthenticated: ComputedRef     — true si user !== null
  ├─ isInitialized: Ref<boolean>      — true après la première tentative de fetch
  ├─ login()                          — redirige vers /auth/github/redirect
  └─ logout()                         — DELETE /auth/logout + user = null
```

`Data.User` est le type inféré depuis `UserTransformer` (AdonisJS) via la génération Tuyau.

## 4. Database Strategy

- **Upsert is Key:** Since we fetch batches of 100 from GitHub based on user queries, we must aggressively use `updateOrCreate` based on `github_repo_id` to avoid duplicates.
- **Persistence:** Data fetched from GitHub becomes "our" data permanently to speed up future requests.

## 5. Security

- **Session:** Pas de `localStorage`. La session AdonisJS est stockée dans un cookie HTTP-Only, SameSite=Lax, géré entièrement par le serveur.
- **SSR Cookie Forwarding:** Les cookies sont forwardés explicitement dans les requêtes SSR → l'API peut authentifier les requêtes server-side sans exposer de token côté client.
- **Rate Limits:** Monitor GitHub API headers to respect the 5000 req/hour limit per user token.
