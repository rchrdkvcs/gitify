# Base de données

PostgreSQL (18 dans Docker Compose). Tous les modèles utilisent des **ULID** comme clé primaire (générés via le hook `@beforeCreate`).

`database/schema.ts` est **auto-généré** par `node ace migration:run`. Il contient les classes de base que les modèles Lucid étendent. Ne jamais l'éditer manuellement.

---

## Tables

### `users`

| Colonne                 | Type                | Description                                                                                            |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------------------------------ |
| `id`                    | `string` (ULID, PK) | Identifiant interne                                                                                    |
| `email`                 | `string`            | Adresse e-mail GitHub (unique) ; change seulement vers un email vérifié libre                          |
| `github_user_id`        | `string \| null`    | Identité GitHub stable et unique ; null pour un compte historique jusqu'à sa liaison par email vérifié |
| `name`                  | `string \| null`    | Nom d'affichage (login GitHub si absent)                                                               |
| `avatar_url`            | `string \| null`    | URL de l'avatar GitHub                                                                                 |
| `github_access_token`   | `string \| null`    | Token OAuth courant — **jamais exposé en réponse API**                                                 |
| `is_verified`           | `boolean \| null`   | État de vérification e-mail GitHub                                                                     |
| `preferences`           | `jsonb \| null`     | `{ level, languages, contributionTypes, topics }` (voir ci-dessous)                                    |
| `onboarded_at`          | `timestamp \| null` | Fin du parcours guidé ; null tant qu'il n'est pas terminé, y compris pour les comptes historiques      |
| `onboarding_skipped_at` | `timestamp \| null` | Dernier « Plus tard » : la connexion ne redirige plus vers l'onboarding                                |
| `onboarding_step`       | `smallint`          | Dernière question confirmée (0 à 4), pour reprendre le parcours                                        |
| `created_at`            | `timestamp`         |                                                                                                        |
| `updated_at`            | `timestamp`         |                                                                                                        |

`preferences.level` vaut `first_contribution`, `some_contributions` ou `experienced`. Les trois listes contiennent des identifiants canoniques (`shared/preferences.ts`) ; vide signifie « pas de préférence ». La migration `1791800000007` convertit l'ancien format `{ difficulty, languages }` (`beginner` → `first_contribution`, `expert` → `experienced`, `contributionTypes: ["code"]`) et le rétablit au rollback. Le modèle `User` normalise aussi les valeurs lues, quel que soit leur format.

---

### `projects`

| Colonne                    | Type                | Description                                                                                                                                                 |
| -------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                       | `string` (ULID, PK) |                                                                                                                                                             |
| `github_repo_id`           | `bigint`            | ID GitHub — **clé d'upsert** pour éviter les doublons                                                                                                       |
| `name`                     | `string`            | Nom du dépôt                                                                                                                                                |
| `owner_name`               | `string`            | Login du propriétaire GitHub                                                                                                                                |
| `description`              | `string \| null`    |                                                                                                                                                             |
| `repository_url`           | `string`            | URL GitHub du dépôt                                                                                                                                         |
| `stars`                    | `integer`           | Nombre d'étoiles                                                                                                                                            |
| `forks_count`              | `integer`           |                                                                                                                                                             |
| `open_issues_count`        | `integer`           | Compteur GitHub brut ; aucun décompte séparé des pull requests                                                                                              |
| `language`                 | `string \| null`    | Langage principal, normalisé en minuscules                                                                                                                  |
| `topics`                   | `jsonb \| null`     | Tableau de sujets GitHub `["framework", "typescript"]`                                                                                                      |
| `difficulty`               | `string`            | Niveau affiché quand le dépôt n'a aucune appartenance (importé par une recherche d'issues ou sorti des recherches) ; la sélection utilise les appartenances |
| `readme`                   | `text \| null`      | README décodé en UTF-8 (chargé à la demande)                                                                                                                |
| `languages`                | `jsonb \| null`     | Répartition en octets `{ TypeScript: 145000, ... }`                                                                                                         |
| `latest_release`           | `string \| null`    | Tag de la dernière release GitHub (`v1.2.3`)                                                                                                                |
| `total_contributors_count` | `integer \| null`   | Total inféré via le header `Link` de l'API GitHub                                                                                                           |
| `details_fetched_at`       | `timestamp \| null` | Horodatage du dernier enrichissement — null = jamais chargé                                                                                                 |
| `insights`                 | `jsonb \| null`     | Instantané GitHub de la fiche, dont `contributorActivity` pour le score d'accueil                                                                           |
| `is_archived`              | `boolean`           | Dépôt archivé sur GitHub, écrit avec l'instantané `insights` ; exclu des listes                                                                             |
| `newcomer_score`           | `smallint \| null`  | Score d'accueil des débutants (0–100), seule source du score, indexé pour le tri ; null = non évalué                                                        |
| `newcomer_score_details`   | `jsonb \| null`     | Détail du score sans le score lui-même : signaux, couverture, `partial`, `archived`, date de calcul                                                         |
| `created_at`               | `timestamp`         |                                                                                                                                                             |
| `updated_at`               | `timestamp`         |                                                                                                                                                             |

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

| Colonne        | Type                | Description                                                             |
| -------------- | ------------------- | ----------------------------------------------------------------------- |
| `id`           | `string` (ULID, PK) |                                                                         |
| `language`     | `string`            | Langage en minuscules (`typescript`, `python`…)                         |
| `difficulty`   | `string`            | `beginner` ou `expert`                                                  |
| `total_stored` | `integer`           | Nombre de projets stockés lors du dernier fetch                         |
| `fetched_at`   | `timestamp \| null` | Dernière recherche réussie ; null si aucune recherche n'a encore réussi |
| `retry_after`  | `timestamp \| null` | Prochaine tentative autorisée après un échec distant                    |
| `created_at`   | `timestamp`         |                                                                         |
| `updated_at`   | `timestamp`         |                                                                         |

---

### `project_issues`

Issues ouvertes retenues par le fil `/issues`. Chaque issue référence le dépôt enregistré dans `projects` ; un dépôt découvert par une issue est créé sans appartenance de recherche, il reste hors du catalogue mais sa page projet existe.

| Colonne             | Type                | Description                                     |
| ------------------- | ------------------- | ----------------------------------------------- |
| `id`                | `string` (ULID, PK) |                                                 |
| `project_id`        | `string` (FK)       | Référence `projects.id`, suppression cascade    |
| `github_issue_id`   | `bigint`            | ID GitHub de l'issue — **clé d'upsert**, unique |
| `number`            | `integer`           | Numéro de l'issue dans son dépôt                |
| `title`             | `text`              |                                                 |
| `url`               | `string`            | URL GitHub de l'issue                           |
| `labels`            | `jsonb`             | `[{ name, color }]`, 10 premiers labels         |
| `comments_count`    | `integer`           |                                                 |
| `assignees_count`   | `integer`           | 0 = non assignée (filtre par défaut)            |
| `github_created_at` | `timestamp \| null` | Date d'ouverture sur GitHub, tri par défaut     |
| `created_at`        | `timestamp`         |                                                 |
| `updated_at`        | `timestamp`         |                                                 |

### `issue_search_memberships`

Associe une issue à un critère `(language, kind)` ; `kind` vaut `good-first-issue`, `help-wanted` ou `documentation`. `(language, kind, issue_id)` est unique, `issue_id` référence `project_issues.id` avec suppression en cascade. Une recherche réussie remplace ses appartenances dans une transaction, puis supprime les issues qui n'en ont plus.

### `issue_search_caches`

Fraîcheur des recherches d'issues, sur le modèle de `github_fetch_caches`, unique par `(language, kind)`.

| Colonne        | Type                | Description                                            |
| -------------- | ------------------- | ------------------------------------------------------ |
| `id`           | `string` (ULID, PK) |                                                        |
| `language`     | `string`            | Langage en minuscules                                  |
| `kind`         | `string`            | Type d'issue recherché                                 |
| `total_stored` | `integer`           | Issues retenues lors du dernier import                 |
| `fetched_at`   | `timestamp \| null` | Dernière recherche réussie ; null si aucune n'a réussi |
| `retry_after`  | `timestamp \| null` | Prochaine tentative autorisée après un échec distant   |
| `created_at`   | `timestamp`         |                                                        |
| `updated_at`   | `timestamp`         |                                                        |

## Gestion des migrations

### Appartenances aux recherches

`project_search_memberships` associe un dépôt à un critère `(language, difficulty)`.
Son identifiant ULID est unique, et `(language, difficulty, project_id)` possède
une contrainte d'unicité. `project_id` référence `projects.id` avec suppression
en cascade. Un même dépôt peut appartenir aux deux niveaux ou à plusieurs
recherches sans dupliquer son identité ni ses favoris. Chaque recherche réussie
remplace sa liste d'appartenances dans une transaction ; un échec conserve la
liste précédente. La migration reprend les appartenances des projets historiques.

Un index `(stars DESC)` permet un parcours trié compatible avec les recherches
par appartenance, dont le langage peut différer du langage principal du dépôt.
Sa mesure est décrite dans [le relevé PostgreSQL](project-index-measurement-2026-10-12.md).
Un index d'expression `(lower(owner_name), lower(name))` sert la recherche
insensible à la casse de la page projet.

### Exécution

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
