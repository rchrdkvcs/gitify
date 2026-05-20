# Guide de contribution

## Branches

Chaque branche doit être créée depuis `master` et cibler `master` en PR. La convention de nommage suit le domaine de la modification :

| Préfixe     | Usage                                                    | Exemples                                    |
| ----------- | -------------------------------------------------------- | ------------------------------------------- |
| `feat/`     | Nouvelle fonctionnalité visible côté utilisateur         | `feat/project-details-page`                 |
| `fix/`      | Correction d'un bug                                      | `fix/feed-round-robin-off-by-one`           |
| `core/`     | Infrastructure, configuration, dépendances, Docker, CI   | `core/upgrade-adonisjs-7.4`                 |
| `docs/`     | Documentation uniquement (`docs/`)                       | `docs/open-api`, `docs/update-architecture` |
| `refactor/` | Remaniement interne sans changement de comportement      | `refactor/extract-github-api-client`        |
| `test/`     | Ajout ou correction de tests                             | `test/project-feed-service-unit`            |
| `chore/`    | Tâches de maintenance (lockfile, scripts, oxlint rules…) | `chore/update-pnpm-lockfile`                |

> Une branche = un sujet. Ne pas mélanger une feature et un refactor dans la même branche.

### Exemple

```bash
git checkout master
git pull
git checkout -b feat/liked-projects-filter
```

---

## Commits — Conventional Commits

Les messages de commit suivent la spécification [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope optionnel>): <description courte en minuscules>

[corps optionnel]

[footer optionnel : BREAKING CHANGE, Co-Authored-By…]
```

### Types

| Type       | Usage                                                         |
| ---------- | ------------------------------------------------------------- |
| `feat`     | Nouvelle fonctionnalité                                       |
| `fix`      | Correction de bug                                             |
| `docs`     | Modification de documentation uniquement                      |
| `refactor` | Changement de code sans ajout de feature ni correction de bug |
| `test`     | Ajout ou modification de tests                                |
| `core`     | Infra, config, dépendances, Docker, CI                        |
| `chore`    | Maintenance sans impact sur le code applicatif                |
| `perf`     | Amélioration de performance                                   |

### Exemples

```
feat(feed): add round-robin distribution across languages
fix(auth): handle missing githubAccessToken on callback
docs(openapi): translate all descriptions to French
core(docker): upgrade postgres image to alpine 3.21
refactor(github): extract search query builder to static method
test(feed): add unit tests for countAvailable
```

---

## Qualité du code

Avant de créer une PR, vérifier localement :

```bash
# Vérification TypeScript (API)
cd apps/api && pnpm typecheck

# Lint (depuis la racine)
pnpm lint

# Formatage (depuis la racine)
pnpm fmt:check
```

Les corrections de lint peuvent être appliquées automatiquement :

```bash
pnpm lint:fix
pnpm fmt
```

---

## Process de PR

1. **Créer la branche** depuis `master` en suivant la convention de nommage.
2. **Développer** — commits atomiques avec les messages Conventional Commits.
3. **Vérifier** TypeScript, lint et formatage avant de pousser.
4. **Ouvrir la PR** vers `master` avec :
   - Un titre qui suit la convention de commit (`feat(scope): description`)
   - Une description expliquant le _pourquoi_ du changement
   - Les éventuelles étapes de test ou de migration à effectuer
5. **Review** — attendre au moins une approbation avant de merger.

---

## Tests

Les tests utilisent [Japa](https://japa.dev/), intégré nativement à AdonisJS.

```bash
# Tous les tests
cd apps/api && node ace test

# Par suite
node ace test --suite=unit
node ace test --suite=functional
```

- **`tests/unit/`** — tests des services et utilitaires en isolation (timeout : 2 s)
- **`tests/functional/`** — tests des routes HTTP avec une vraie base de données (timeout : 30 s)

---

## Ajouter une migration

```bash
cd apps/api
node ace make:migration create_<table>_table
# Éditer le fichier généré dans database/migrations/
node ace migration:run
# Le fichier database/schema.ts est mis à jour automatiquement
```

> Ne jamais éditer `database/schema.ts` directement — il est entièrement géré par `migration:run`.
