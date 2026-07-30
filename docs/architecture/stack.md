# Stack et structure

## Stack technique

| Couche          | Technologie                                               |
| --------------- | --------------------------------------------------------- |
| Monorepo        | pnpm workspaces + Turborepo                               |
| Backend         | AdonisJS 7 + TypeScript (Node.js 24)                      |
| Frontend        | Nuxt 4 + Vue 3 + Pinia + @nuxt/ui + Tailwind CSS v4       |
| Base de données | PostgreSQL 15                                             |
| ORM             | Lucid (AdonisJS)                                          |
| Auth            | Adonis Ally (GitHub OAuth 2.0) + session HTTP-Only cookie |
| Validation      | VineJS                                                    |
| Client API typé | Tuyau (génération auto depuis les routes AdonisJS)        |
| OpenAPI         | @foadonis/openapi + Scalar UI (`GET /docs`)               |
| Linting         | oxlint                                                    |
| Formatage       | oxfmt                                                     |
| Tests           | Japa (intégré AdonisJS)                                   |
| Infra dev       | Docker Compose                                            |

## Turborepo

`turbo.json` définit les tâches et leurs dépendances. Les points importants :

- `build` : dépend de `^build` (les dépendances sont buildées avant) — produit `.adonisjs/` (Tuyau + OpenAPI registry) nécessaire au frontend
- `dev` : pas de cache, persistant (serveurs de dev)
- `test` : dépend de `build` pour que les types Tuyau soient disponibles

## Structure des fichiers

```
apps/api/
├── app/
│   ├── controllers/          # Couche HTTP — reçoit les requêtes, délègue aux services
│   │   ├── auth_controller.ts
│   │   ├── preferences_controller.ts
│   │   └── project_controller.ts
│   ├── middlewares/
│   │   ├── auth_middleware.ts               # Vérifie la session, retourne 401 sinon
│   │   ├── container_bindings_middleware.ts
│   │   └── force_json_response_middleware.ts
│   ├── models/               # Modèles Lucid (étendent le schema auto-généré)
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── contributor.ts
│   │   ├── user_project_favorite.ts
│   │   └── github_fetch_cache.ts
│   ├── schemas/              # DTOs OpenAPI (classes décorées @ApiProperty)
│   │   ├── user_schemas.ts
│   │   └── project_schemas.ts
│   ├── services/
│   │   ├── auth_service.ts                        # Upsert utilisateur depuis GitHub
│   │   ├── project_feed_service.ts                # Orchestration du fil et des favoris
│   │   └── github/
│   │       ├── github_api_client.ts               # Client HTTP GitHub API
│   │       └── github_sync_service.ts             # Ingestion et cache GitHub → DB
│   ├── transformers/
│   │   └── user_transformer.ts   # Sélectionne les champs User exposés en réponse
│   └── validators/
│       ├── update_preferences_validator.ts
│       └── project_id_validator.ts
├── config/
│   ├── gitify.ts             # Paramètres métier (seuils, limites, langages showcase)
│   ├── openapi.ts            # Configuration Scalar, schémas de sécurité, tags
│   ├── ally.ts               # Configuration GitHub OAuth (Ally)
│   ├── auth.ts               # Guard de session
│   ├── cors.ts               # Origines autorisées
│   └── database.ts           # Connexion PostgreSQL
├── database/
│   ├── migrations/           # Migrations Lucid (ordre chronologique)
│   ├── schema.ts             # Auto-généré par `migration:run` — ne pas éditer
│   └── seeders/
│       └── showcase_seeder.ts
├── providers/
│   └── api_provider.ts       # Injecte serialize / serialize.withoutWrapping dans HttpContext
├── start/
│   ├── routes.ts             # Toutes les routes + enregistrement OpenAPI
│   ├── kernel.ts             # Stack de middlewares globaux
│   └── env.ts                # Validation des variables d'environnement (VineJS)
└── adonisrc.ts               # Providers, hooks Tuyau, suites de tests

apps/web/
├── app/
│   ├── composables/
│   │   ├── useHttp.ts          # Wrapper $fetch avec baseURL + credentials
│   │   ├── useFavorite.ts      # Ajout/retrait optimiste des favoris
│   │   └── usePreferences.ts   # Formulaire de préférences utilisateur
│   ├── middlewares/
│   │   ├── auth.ts             # Redirige vers / si non authentifié
│   │   └── guest.ts            # Redirige vers / si déjà authentifié
│   ├── pages/
│   │   ├── index.vue           # Page d'accueil / vitrine
│   │   ├── explore.vue         # Fil personnalisé (route protégée)
│   │   ├── favorites.vue       # Projets favoris (route protégée)
│   │   └── projects/[id].vue   # Détail d'un projet
│   ├── plugins/
│   │   ├── auth.ts             # Initialise l'état auth au démarrage (SSR + client)
│   │   └── tuyau.ts            # Instancie le client Tuyau typé
│   ├── queries/
│   │   └── projects.ts         # Query options Pinia Colada (feed + favoris)
│   └── stores/
│       └── auth.ts             # Pinia store — source de vérité utilisateur
```

## Import aliases (API)

L'API utilise le système `imports` de Node.js (pas des alias TypeScript). Définis dans `apps/api/package.json` :

| Alias             | Résolution                |
| ----------------- | ------------------------- |
| `#controllers/*`  | `./app/controllers/*.js`  |
| `#services/*`     | `./app/services/*.js`     |
| `#models/*`       | `./app/models/*.js`       |
| `#schemas/*`      | `./app/schemas/*.js`      |
| `#validators/*`   | `./app/validators/*.js`   |
| `#transformers/*` | `./app/transformers/*.js` |
| `#config/*`       | `./config/*.js`           |
| `#database/*`     | `./database/*.js`         |
| `#start/*`        | `./start/*.js`            |
| `#generated/*`    | `./.adonisjs/server/*.js` |
| `#providers/*`    | `./providers/*.js`        |

## Tuyau — génération du client typé

Au démarrage de l'API (`node ace serve` ou `node ace build`), le hook `generateRegistry()` dans `adonisrc.ts` génère :

- `.adonisjs/client/registry/` — registry Tuyau exposé par `@gitify/api/registry`
- `.adonisjs/client/data.d.ts` — types des réponses API exposés par `@gitify/api/data`

Ces exports sont consommés par le frontend pour avoir un client HTTP type-safe sans duplication de types.
