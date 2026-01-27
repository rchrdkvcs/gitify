# Getting Started

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) et [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 24+](https://nodejs.org/) (pour le dev local sans Docker)
- [pnpm](https://pnpm.io/installation) (pour le dev local sans Docker)

## Structure du projet

```
gitify/
├── apps/
│   ├── api/          # Backend AdonisJS (port 3333)
│   └── web/          # Frontend Nuxt 4 (port 3000)
├── docs/
├── compose.dev.yaml  # Docker Compose pour le dev
├── compose.yml       # Docker Compose pour la production
├── Dockerfile.dev    # Image Docker de dev
└── package.json
```

## Configuration

Avant de lancer le projet, copier les fichiers d'environnement :

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Variables d'environnement de l'API (`apps/api/.env`)

| Variable         | Description                 | Valeur par defaut   |
|------------------|-----------------------------|---------------------|
| `PORT`           | Port du serveur             | `3333`              |
| `HOST`           | Host du serveur             | `0.0.0.0`           |
| `NODE_ENV`       | Environnement Node          | `development`       |
| `APP_KEY`        | Cle de chiffrement de l'app | a generer           |
| `DB_HOST`        | Host PostgreSQL             | `database` (Docker) |
| `DB_PORT`        | Port PostgreSQL             | `5432`              |
| `DB_USER`        | Utilisateur PostgreSQL      | `root`              |
| `DB_PASSWORD`    | Mot de passe PostgreSQL     | `root`              |
| `DB_DATABASE`    | Nom de la base de donnees   | `app`               |
| `SESSION_DRIVER` | Driver de session           | `cookie`            |

### Variables d'environnement du Frontend (`apps/web/.env`)

| Variable       | Description      | Valeur par defaut       |
| -------------- | ---------------- |-------------------------|
| `VITE_API_URL` | URL de l'API     | `http://localhost:3333` |

---

## Lancement avec Docker

### Demarrer le projet

```bash
pnpm docker:up
```

Cela build les images, lance PostgreSQL, l'API et le frontend. Les services demarrent en arriere-plan (`-d`).

- Frontend : http://localhost:3000
- API : http://localhost:3333
- PostgreSQL : `localhost:5432`

### Voir les logs

```bash
# Tous les services
pnpm docker:logs

# Un service specifique
pnpm docker:logs:api
pnpm docker:logs:web
pnpm docker:logs:db
```

### Redemarrer les services

```bash
pnpm docker:restart
```

### Arreter le projet

```bash
pnpm docker:down
```

### Reset complet (supprime les volumes et les donnees)

```bash
pnpm docker:clean
```

### Reconstruire apres un changement de dependances

Quand un `package.json` ou le `pnpm-lock.yaml` change :

```bash
pnpm docker:clean
pnpm docker:up
```

---

## Lancement local (sans Docker)

### Installer les dependances

```bash
pnpm install
```

### Lancer PostgreSQL

Lancer une instance PostgreSQL (via Docker ou localement) et configurer `apps/api/.env` avec les bons parametres de connexion.

```bash
docker compose -f compose.dev.yaml up database -d
```

### Lancer le projet

```bash
# API + Frontend en parallele
pnpm dev

# Ou separement
pnpm dev:api
pnpm dev:web
```

---

## Commandes utiles

| Commande               | Description                         |
|------------------------|-------------------------------------|
| `pnpm dev`             | Lance l'API et le frontend en local |
| `pnpm dev:api`         | Lance l'API uniquement              |
| `pnpm dev:web`         | Lance le frontend uniquement        |
| `pnpm docker:up`       | Build et lance tout via Docker      |
| `pnpm docker:down`     | Arrete les containers               |
| `pnpm docker:logs`     | Affiche les logs (follow)           |
| `pnpm docker:logs:api` | Logs de l'API                       |
| `pnpm docker:logs:web` | Logs du frontend                    |
| `pnpm docker:logs:db`  | Logs de PostgreSQL                  |
| `pnpm docker:restart`  | Redemarre les services              |
| `pnpm docker:clean`    | Arrete tout et supprime les volumes |
