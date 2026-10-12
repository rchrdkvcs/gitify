# Contribuer

Toutes les commandes s'exécutent à la racine du dépôt. Voir [le démarrage](getting-started.md) pour l'environnement local.

```bash
pnpm dev
pnpm lint:fix
pnpm fmt
pnpm build
pnpm typecheck
pnpm test
```

Avant une pull request, vérifier `pnpm lint`, `pnpm fmt:check`, `pnpm build`, `pnpm typecheck` et les tests avec une base PostgreSQL dédiée. La CI réalise ces contrôles sur Node.js 24.

Les règles Oxlint serveur et Vue sont dans `oxlint.config.ts`. Le formatage et le tri des classes Tailwind sont configurés dans `oxfmt.config.ts`. Les fichiers générés ne doivent pas être modifiés manuellement.

Ajouter les routes dans `start/routes.ts`, la logique HTTP dans les contrôleurs et les traitements métier dans les services. Les écrans vont dans `inertia/pages/`, les composants réutilisables dans `inertia/components/`. Ne transmettre au navigateur que les champs nécessaires via des transformers.

Créer une migration avec `node ace make:migration`, puis l'exécuter avec `node ace migration:run`. Lucid régénère `database/schema.ts` : conserver ce schéma versionné et ne pas l'éditer à la main.

Les releases et le déploiement sont gérés séparément ; aucun workflow de release automatique n'est configuré.

TypeScript reste sur la dernière version 6 (`~6.0.3`) : `vue-tsc` 3.3.13 dépend encore de l’API JavaScript du compilateur, et l’assembleur AdonisJS 8.5.2 déclare uniquement TypeScript 5 et 6 compatibles. TypeScript 7.0.2 échoue avec `ERR_PACKAGE_PATH_NOT_EXPORTED` sur `typescript/lib/tsc`. Les autres dépendances directes et pnpm sont à leurs dernières versions stables au moment de la migration.
