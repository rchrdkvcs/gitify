# CONTRIBUTING GUIDELINES - GitMatch

## 1. Gitflow Workflow
* 🔴 **`main`**: Production.
* 🟡 **`develop`**: Integration/Staging.
* 🟢 **`feat/xxx`**: Feature branches.

**Rule:** PRs must target `develop`.

## 2. Commit Convention
Follow **Conventional Commits**:
* `feat`: New feature.
* `fix`: Bug fix.
* `chore`: Config changes (e.g., pnpm lockfile).
* `test`: Adding missing tests (Jest/Japa).

## 3. Definition of Done
* Code passes ESLint.
* **Backend Tests:** Run `pnpm test` (Japa) -> All green.
* **Frontend Tests:** Run `pnpm test` (Jest) -> All green.
* Feature works in Docker (`docker-compose up`).
