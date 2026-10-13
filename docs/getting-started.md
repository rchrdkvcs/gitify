# Démarrer Gitify

## Prérequis

- Node.js 24 ou supérieur et pnpm 12.11.2 (version déclarée dans `package.json`).
- PostgreSQL ; Docker Compose fournit PostgreSQL 18 pour le développement.
- Une application OAuth GitHub pour se connecter.

## Configuration

```bash
pnpm install
cp .env.example .env
node ace generate:key
```

Configurer `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` et `DB_DATABASE` pour PostgreSQL. `APP_KEY` est générée localement et doit rester stable en production. `SESSION_DRIVER=cookie` utilise un cookie signé et chiffré ; `memory` est également disponible pour les tests.

Dans GitHub, créer une OAuth App avec la page d'accueil `http://localhost:3333` et le callback `http://localhost:3333/auth/github/callback`. Copier ses identifiants dans `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET`. `GITHUB_CALLBACK_URL` doit correspondre à l'origine utilisée dans le navigateur.

`GITHUB_SERVER_TOKEN` est facultatif : c'est un jeton d'accès personnel GitHub sans scope particulier (dépôts publics uniquement), requis par le seeder de vitrine et le chargement paresseux de la vitrine publique depuis GitHub. Les utilisateurs connectés utilisent leur jeton OAuth pour les recherches personnalisées. Ne jamais publier `.env`.

## Développement local

```bash
docker compose -f compose.dev.yaml up -d database
node ace migration:run
# Facultatif, nécessite GITHUB_SERVER_TOKEN :
node ace db:seed
pnpm dev
```

L'application est accessible sur http://localhost:3333. AdonisJS fournit les pages et la session ; Vite fournit les ressources sur le port 5173. Il n'y a pas de serveur frontend séparé.

## Développement avec Docker

```bash
pnpm docker:up
docker compose -f compose.dev.yaml exec app node ace migration:run
pnpm docker:logs
pnpm docker:down
```

Compose lance `app` et `database`. Après une modification des dépendances, exécuter `docker compose -f compose.dev.yaml exec app pnpm install --frozen-lockfile` pour actualiser le volume de dépendances. La base existante peut être conservée : les migrations métier n'ont pas changé. Le volume PostgreSQL est monté sur `/var/lib/postgresql`. Les images 18 y créent le cluster dans `18/docker`. Un volume dont les fichiers sont directement dans `/var/lib/postgresql/data` appartient à PostgreSQL 17 et ne démarre pas avec cette image.

## Validation et tests

```bash
pnpm lint
pnpm fmt:check
pnpm build
pnpm typecheck
DB_DATABASE=gitify_test NODE_ENV=test node ace migration:run --force
DB_DATABASE=gitify_test pnpm test
```

Utiliser une base de test dédiée : les tests fonctionnels créent des utilisateurs, des projets et des favoris dans des transactions annulées à la fin de chaque test.

## Production

```bash
pnpm build
cd build
pnpm install --prod --frozen-lockfile
node bin/server.js
```

Fournir les variables d'environnement au serveur, avec `NODE_ENV=production`, `HOST=0.0.0.0` et un callback GitHub HTTPS. Le serveur sert aussi les ressources compilées. `Dockerfile` construit la même application sur Node.js 24. Exécuter les migrations avant de démarrer une nouvelle version.

L'ancien déploiement API/front et les workflows Release Please ont été retirés. Configurer un seul service de déploiement sur le `Dockerfile` racine.
