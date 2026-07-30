# Base de données

PostgreSQL 15. Tous les modèles utilisent des **ULID** comme clé primaire (générés via le hook `@beforeCreate`).

`database/schema.ts` est **auto-généré** par `node ace migration:run`. Il contient les classes de base que les modèles Lucid étendent. Ne jamais l'éditer manuellement.

---

## Tables

### `users`

| Colonne               | Type                | Description                                                 |
| --------------------- | ------------------- | ----------------------------------------------------------- |
| `id`                  | `string` (ULID, PK) | Identifiant interne                                         |
| `email`               | `string`            | Adresse e-mail GitHub (unique, clé d'upsert OAuth)          |
| `name`                | `string \| null`    | Nom d'affichage (login GitHub si absent)                    |
| `avatar_url`          | `string \| null`    | URL de l'avatar GitHub                                      |
| `github_access_token` | `string \| null`    | Token OAuth courant — **jamais exposé en réponse API**      |
| `is_verified`         | `boolean \| null`   | État de vérification e-mail GitHub                          |
| `preferences`         | `jsonb \| null`     | `{ difficulty: "beginner"\|"expert", languages: string[] }` |
| `created_at`          | `timestamp`         |                                                             |
| `updated_at`          | `timestamp`         |                                                             |

---

### `projects`

| Colonne                    | Type                | Description                                                 |
| -------------------------- | ------------------- | ----------------------------------------------------------- |
| `id`                       | `string` (ULID, PK) |                                                             |
| `github_repo_id`           | `bigint`            | ID GitHub — **clé d'upsert** pour éviter les doublons       |
| `name`                     | `string`            | Nom du dépôt                                                |
| `owner_name`               | `string`            | Login du propriétaire GitHub                                |
| `description`              | `string \| null`    |                                                             |
| `repository_url`           | `string`            | URL GitHub du dépôt                                         |
| `stars`                    | `integer`           | Nombre d'étoiles                                            |
| `forks_count`              | `integer`           |                                                             |
| `open_issues_count`        | `integer`           | Issues ouvertes (hors PRs, filtrées à l'ingestion)          |
| `language`                 | `string \| null`    | Langage principal, normalisé en minuscules                  |
| `topics`                   | `jsonb \| null`     | Tableau de sujets GitHub `["framework", "typescript"]`      |
| `difficulty`               | `string`            | `beginner` ou `expert`                                      |
| `readme`                   | `text \| null`      | README décodé en UTF-8 (chargé à la demande)                |
| `languages`                | `jsonb \| null`     | Répartition en octets `{ TypeScript: 145000, ... }`         |
| `latest_release`           | `string \| null`    | Tag de la dernière release GitHub (`v1.2.3`)                |
| `total_contributors_count` | `integer \| null`   | Total inféré via le header `Link` de l'API GitHub           |
| `details_fetched_at`       | `timestamp \| null` | Horodatage du dernier enrichissement — null = jamais chargé |
| `created_at`               | `timestamp`         |                                                             |
| `updated_at`               | `timestamp`         |                                                             |

---

### `contributors`

| Colonne          | Type                | Description                             |
| ---------------- | ------------------- | --------------------------------------- |
| `id`             | `string` (ULID, PK) |                                         |
| `project_id`     | `string` (FK)       | Référence `projects.id`                 |
| `github_user_id` | `bigint \| null`    | ID GitHub — **clé d'upsert** par projet |
| `login`          | `string`            | Nom d'utilisateur GitHub                |
| `avatar_url`     | `string`            |                                         |
| `profile_url`    | `string`            | URL du profil GitHub                    |
| `contributions`  | `integer \| null`   | Nombre de commits sur le dépôt          |
| `created_at`     | `timestamp`         |                                         |
| `updated_at`     | `timestamp`         |                                         |

---

### `user_project_favorites`

Enregistre les projets favoris de chaque utilisateur. La contrainte d'unicité sur `(user_id, project_id)` empêche les doublons.

| Colonne      | Type                | Description                                  |
| ------------ | ------------------- | -------------------------------------------- |
| `id`         | `string` (ULID, PK) |                                              |
| `user_id`    | `string` (FK)       | Référence `users.id`, suppression cascade    |
| `project_id` | `string` (FK)       | Référence `projects.id`, suppression cascade |
| `created_at` | `timestamp`         | Date d'ajout aux favoris                     |
| `updated_at` | `timestamp`         |                                              |

---

### `github_fetch_caches`

Trace les appels GitHub Search API par couple `(language, difficulty)` pour éviter de dépasser le rate limit et de refaire des appels inutiles.

| Colonne        | Type                | Description                                       |
| -------------- | ------------------- | ------------------------------------------------- |
| `id`           | `string` (ULID, PK) |                                                   |
| `language`     | `string`            | Langage en minuscules (`typescript`, `python`…)   |
| `difficulty`   | `string`            | `beginner` ou `expert`                            |
| `total_stored` | `integer`           | Nombre de projets stockés lors du dernier fetch   |
| `fetched_at`   | `timestamp`         | Horodatage du dernier appel GitHub pour ce couple |
| `created_at`   | `timestamp`         |                                                   |
| `updated_at`   | `timestamp`         |                                                   |

---

## Gestion des migrations

Les migrations sont dans `database/migrations/`, ordonnées par timestamp. Ne jamais modifier une migration déjà appliquée — créer une nouvelle migration corrective à la place.

```bash
# Appliquer les migrations en attente
node ace migration:run

# Annuler la dernière batch de migrations
node ace migration:rollback

# État des migrations
node ace migration:status

# Créer une nouvelle migration
node ace make:migration <nom>
```

Après chaque `migration:run`, `database/schema.ts` est régénéré automatiquement.
