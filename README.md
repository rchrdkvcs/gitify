# Gitify

Application AdonisJS 7 avec Inertia et Vue 3 pour découvrir des projets open source et préparer ses premières contributions. Un seul serveur, un seul paquet et une seule configuration d'environnement.

## Démarrage

Prérequis : Node.js 24+, pnpm 12.11.2 et PostgreSQL.

```bash
pnpm install
cp .env.example .env
node ace generate:key
# Renseigner PostgreSQL et les identifiants OAuth GitHub dans .env.
node ace migration:run
pnpm dev
```

Ouvrir http://localhost:3333. Vite sert les ressources de développement sur le port 5173.

```bash
pnpm lint
pnpm fmt:check
pnpm build
pnpm typecheck
pnpm test
```

La compilation génère les déclarations utilisées pour vérifier les types Vue. Exécuter `build` avant `typecheck` sur une installation neuve. Les tests utilisent la base configurée : choisir une base dédiée avec `DB_DATABASE=gitify_test` et y exécuter les migrations.

Voir [le guide de démarrage](docs/getting-started.md) et [l'architecture](docs/architecture/stack.md).
