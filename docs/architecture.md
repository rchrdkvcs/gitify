# TECHNICAL ARCHITECTURE - GitMatch

## 1. Tech Stack
* **Monorepo:**
  * `/backend`: AdonisJS 7 (Node.js) + TypeScript.
  * `/frontend`: Nuxt 4 (Vue.js) + TypeScript + TailwindCSS.
* **Database:** PostgresSQL 15.
* **Infrastructure:** Docker Compose.
* **Package Manager:** `pnpm`.

## 2. Backend (AdonisJS 7)
* **Pattern:** MVC.
* **Testing:** **Japa** (Adonis built-in).
* **Auth:** Adonis Ally (GitHub) + Adonis Native Opaque Token store in HTTP-Only Cookie.

## 3. Frontend (Nuxt 4)
* **Framework:** Vue 4 + Composition API.
* **HTTP Client:** `pinia` (configured as a Nuxt plugin).
* **Fetch api** use native fetch of nuxt
* **Testing:** **Jest** (for Unit/Component testing).
* **State:** Pinia.
* **UI:** TailwindCSS.

## 4. Database Strategy
* **Upsert is Key:** Since we fetch batches of 100 from GitHub based on user queries, we must aggressively use `updateOrCreate` based on `github_repo_id` to avoid duplicates.
* **Persistence:** Data fetched from GitHub becomes "our" data permanently to speed up future requests.

## 5. Security
* **Tokens:** No `localStorage` for tokens. Use secure, HttpOnly, SameSite cookies with Adonis Opaque Tokens.
* **Rate Limits:** Monitor GitHub API headers to respect the 5000 req/hour limit per user token.

