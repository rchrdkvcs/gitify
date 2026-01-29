# TECHNICAL ARCHITECTURE - GitMatch

## 1. Tech Stack
* **Monorepo:**
  * `/backend`: AdonisJS (Node.js) + TypeScript.
  * `/frontend`: Nuxt 3 (Vue.js) + TypeScript + TailwindCSS.
* **Database:** PostgreSQL 15.
* **Infrastructure:** Docker Compose.
* **Package Manager:** `pnpm`.

## 2. Backend (AdonisJS)
* **Pattern:** MVC.
* **Testing:** **Japa** (Adonis built-in).
* **Auth:** Adonis Ally (GitHub) + JWT Access Token stored in HTTP-Only Cookie.
* **Data Fetching:** Use `fetch` to communicate with GitHub API.
* **No Scheduler:** Cron jobs are removed in favor of user-triggered Lazy Loading.

## 3. Frontend (Nuxt 3)
* **Framework:** Vue 3 + Composition API.
* **HTTP Client:** `pinia` (configured as a Nuxt plugin or service).
* **Testing:** **Jest** (for Unit/Component testing).
* **State:** Pinia.
* **UI:** TailwindCSS.

## 4. Database Strategy
* **Upsert is Key:** Since we fetch batches of 100 from GitHub based on user queries, we must aggressively use `updateOrCreate` based on `github_repo_id` to avoid duplicates.
* **Persistence:** Data fetched from GitHub becomes "our" data permanently to speed up future requests.

## 5. Security
* **JWT:** No `localStorage` for tokens. Use secure, HttpOnly, SameSite cookies.
* **Rate Limits:** Monitor GitHub API headers to respect the 5000 req/hour limit per user token.
