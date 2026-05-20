# Démarrage du projet

## Prérequis

- [Node.js 24+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/installation)
- [Docker](https://docs.docker.com/get-docker/) et [Docker Compose](https://docs.docker.com/compose/install/)
- Une **GitHub OAuth App** (voir ci-dessous)

## Structure du monorepo

```
gitify/
├── apps/
│   ├── api/          # Backend AdonisJS 7 (port 3333)
│   └── web/          # Frontend Nuxt 4 (port 3000)
├── docs/
├── compose.dev.yaml  # Docker Compose développement
├── turbo.json        # Configuration Turborepo
└── package.json      # Scripts racine + dépendances dev (turbo, oxlint, oxfmt)
```

---

## 1. Créer une GitHub OAuth App

Gitify utilise GitHub comme unique fournisseur d'authentification. Avant de lancer le projet, il faut créer une OAuth App sur GitHub.

1. Aller sur [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**
2. Remplir les champs :
   - **Application name** : `Gitify (dev)`
   - **Homepage URL** : `http://localhost:3000`
   - **Authorization callback URL** : `http://localhost:3333/auth/github/callback`
3. Générer un **Client Secret**
4. Copier le **Client ID** et le **Client Secret** — ils servent à renseigner `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET` dans `apps/api/.env`

---

## 2. Configurer les variables d'environnement

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### API — `apps/api/.env`

| Variable               | Description                                                                    | Défaut                                       |
| ---------------------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| `PORT`                 | Port du serveur API                                                            | `3333`                                       |
| `HOST`                 | Interface réseau                                                               | `localhost` (Docker surcharge à `0.0.0.0`)   |
| `NODE_ENV`             | Environnement Node.js                                                          | `development`                                |
| `TZ`                   | Fuseau horaire du processus                                                    | `UTC`                                        |
| `LOG_LEVEL`            | Niveau de log (pino)                                                           | `info`                                       |
| `APP_KEY`              | Clé de chiffrement AdonisJS (sessions, cookies)                                | Générer avec `node ace generate:key`         |
| `FRONTEND_URL`         | URL du frontend (utilisée pour la redirection OAuth)                           | `http://localhost:3000`                      |
| `DB_HOST`              | Hôte PostgreSQL                                                                | `127.0.0.1` (Docker surcharge à `database`)  |
| `DB_PORT`              | Port PostgreSQL                                                                | `5432`                                       |
| `DB_USER`              | Utilisateur PostgreSQL                                                         | `root`                                       |
| `DB_PASSWORD`          | Mot de passe PostgreSQL                                                        | `root`                                       |
| `DB_DATABASE`          | Nom de la base de données                                                      | `app`                                        |
| `SESSION_DRIVER`       | Driver de session AdonisJS                                                     | `cookie`                                     |
| `GITHUB_CLIENT_ID`     | Client ID de l'OAuth App GitHub                                                | —                                            |
| `GITHUB_CLIENT_SECRET` | Client Secret de l'OAuth App GitHub                                            | —                                            |
| `GITHUB_CALLBACK_URL`  | URL de callback OAuth                                                          | `http://localhost:3333/auth/github/callback` |
| `GITHUB_SERVER_TOKEN`  | PAT GitHub côté serveur (repos publics, aucun scope)                           | Optionnel, requis pour le seeder showcase    |
| `ENABLE_DEV_TOKEN`     | Active un cookie non-HttpOnly + `GET /auth/dev` pour tester dans Bruno/Postman | `true` (dev uniquement)                      |

> `GITHUB_SERVER_TOKEN` est un Personal Access Token sans scope particulier. Il est utilisé pour pré-remplir la vitrine au démarrage sans avoir besoin d'un utilisateur authentifié. Il n'est jamais requis en développement local si vous remplissez la base à la main.

### Web — `apps/web/.env`

| Variable                   | Description          | Défaut                  |
| -------------------------- | -------------------- | ----------------------- |
| `NUXT_PUBLIC_API_BASE_URL` | URL de base de l'API | `http://localhost:3333` |

---

## 3. Lancement avec Docker (recommandé)

Docker Compose orchestre PostgreSQL, l'API et le frontend. Les fichiers sources sont montés en volume : les modifications sont prises en compte sans rebuild.

### Démarrer

```bash
pnpm docker:up
```

Cela construit les images et démarre les trois services en arrière-plan.

| Service    | URL                   |
| ---------- | --------------------- |
| Frontend   | http://localhost:3000 |
| API        | http://localhost:3333 |
| PostgreSQL | `localhost:5432`      |

### Exécuter les migrations

Au premier démarrage (ou après une migration ajoutée), lancer les migrations dans le container API :

```bash
docker compose -f compose.dev.yaml exec api node ace migration:run
```

### Pré-remplir la vitrine (optionnel)

Le seeder showcase interroge GitHub pour récupérer les dépôts les plus populaires par langage. Il nécessite `GITHUB_SERVER_TOKEN`.

```bash
docker compose -f compose.dev.yaml exec api node ace db:seed --files="database/seeders/showcase_seeder.ts"
```

### Commandes Docker courantes

```bash
# Voir les logs en temps réel
pnpm docker:logs         # tous les services
pnpm docker:logs:api     # API uniquement
pnpm docker:logs:web     # Frontend uniquement
pnpm docker:logs:db      # PostgreSQL uniquement

# Redémarrer les services
pnpm docker:restart

# Arrêter les containers (données conservées)
pnpm docker:down

# Reset complet — supprime les containers et les volumes (perte des données)
pnpm docker:clean
```

### Reconstruire après un changement de dépendances

Quand `package.json` ou `pnpm-lock.yaml` change :

```bash
pnpm docker:clean
pnpm docker:up
```

---

## 4. Lancement local (sans Docker)

### Installer les dépendances

```bash
pnpm install
```

### Lancer PostgreSQL

Démarrer uniquement le service base de données via Docker :

```bash
docker compose -f compose.dev.yaml up database -d
```

Ou utiliser une instance PostgreSQL locale — adapter `apps/api/.env` en conséquence.

### Exécuter les migrations

```bash
cd apps/api
node ace migration:run
```

### Lancer le projet

```bash
# API + Frontend en parallèle (via Turborepo)
pnpm dev

# Ou séparément
pnpm dev:api   # AdonisJS avec hot-hook HMR
pnpm dev:web   # Nuxt avec Vite
```

---

## 5. Tableau de bord des commandes

| Commande              | Description                                         |
| --------------------- | --------------------------------------------------- |
| `pnpm dev`            | Lance l'API et le frontend en parallèle (Turborepo) |
| `pnpm dev:api`        | Lance l'API uniquement                              |
| `pnpm dev:web`        | Lance le frontend uniquement                        |
| `pnpm build`          | Build de production des deux apps (Turborepo)       |
| `pnpm lint`           | Lint avec oxlint                                    |
| `pnpm lint:fix`       | Lint avec correction automatique                    |
| `pnpm fmt`            | Formatage avec oxfmt                                |
| `pnpm fmt:check`      | Vérification du formatage                           |
| `pnpm docker:up`      | Build et lance tout via Docker Compose              |
| `pnpm docker:down`    | Arrête les containers (données conservées)          |
| `pnpm docker:clean`   | Arrête tout et supprime les volumes                 |
| `pnpm docker:logs`    | Affiche les logs en temps réel                      |
| `pnpm docker:restart` | Redémarre les services                              |

### Commandes API (`apps/api`)

| Commande                           | Description                              |
| ---------------------------------- | ---------------------------------------- |
| `node ace migration:run`           | Applique les migrations en attente       |
| `node ace migration:rollback`      | Annule la dernière migration             |
| `node ace migration:status`        | Affiche l'état des migrations            |
| `node ace db:seed`                 | Exécute tous les seeders                 |
| `node ace generate:key`            | Génère une `APP_KEY`                     |
| `node ace test`                    | Lance la suite de tests Japa             |
| `node ace test --suite=unit`       | Lance uniquement les tests unitaires     |
| `node ace test --suite=functional` | Lance uniquement les tests fonctionnels  |
| `pnpm typecheck`                   | Vérification TypeScript sans compilation |

---

## 6. Documentation API

Une fois l'API démarrée, la documentation OpenAPI interactive (Scalar UI) est accessible à :

```
http://localhost:3333/docs
```
