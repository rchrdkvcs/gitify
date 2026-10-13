# Architecture

Gitify est une application unique AdonisJS 7 avec Inertia, Vue 3 et Vite. PostgreSQL et Lucid conservent les données métier. GitHub Ally assure l'authentification OAuth, la session repose sur un cookie chiffré, et Shield protège les mutations contre les requêtes CSRF.

```text
app/                Contrôleurs, exceptions, critères de fil, middleware, modèles, services et transformers
providers/          Composition des services dans le conteneur AdonisJS
bin/                Entrées serveur, console et tests
config/             Configuration AdonisJS et intégrations
start/              Routes, middleware et validation de l'environnement
database/           Migrations, schéma généré et seeders
inertia/            Pages, composants, composables et styles Vue
resources/views/    Document HTML Edge utilisé par Inertia
public/             Fichiers statiques
shared/             Catalogues, règles pures (préférences, onboarding, score) et types partagés serveur/navigateur
tests/              Tests Japa
```

`start/routes.ts` déclare les pages et les quelques endpoints JSON nécessaires aux interactions. `app/controllers/pages_controller.ts` assemble les props des pages à partir des modules injectés par le conteneur (`providers/app_provider.ts`) ; `/profil` et `/preferences` sont rendues directement depuis les routes. Les transformers définissent les champs transmis au navigateur.

Les imports serveur utilisent les alias Node.js du `package.json` (`#models`, `#services`, `#shared`, etc.). Vite utilise `~/`, `@shared/` et `@generated/` dans le front.

Les hooks `indexEntities` et `indexPages` génèrent les types dans `.adonisjs/`. Vite génère également les déclarations de composants et d'auto-imports dans `inertia/`. Ces fichiers sont ignorés par Git et régénérés pendant le développement et la compilation. La vérification des types couvre le serveur et les fichiers Vue.

Oxlint et Oxfmt sont les outils de lint et de formatage. `pnpm-workspace.yaml` contient uniquement la politique de scripts d'installation des dépendances ; aucun workspace n'y est déclaré.
