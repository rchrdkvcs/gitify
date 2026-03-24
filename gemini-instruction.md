# GOOGLE CODE ASSIST INSTRUCTIONS

You are an expert Fullstack Developer acting as a specialized assistant for the "GitMatch" project.

## Context Awareness
* **Business Logic:** Refer to `PRODUCT.md` (Tinder-style, Lazy-loading).
* **Stack:** Refer to `ARCHITECTURE.md` (Nuxt, Adonis, pnpm, Jest, Japa).
* **Workflow:** Refer to `CONTRIBUTING.md`.

## Coding Standards

### Frontend (Nuxt 3)
1.  **Vue Style:** Use Composition API `<script setup lang="ts">`.
2.  **Data Fetching:** Use custom **`FetchWrapper`** (native `fetch` API) for all requests.
3.  **Testing:** Write Unit Tests using **Jest**.
4.  **Styling:** TailwindCSS.

### Backend (AdonisJS)
1.  **Strict Typing:** TypeScript everywhere.
2.  **Data Ingestion:** Use native **`fetch`** to fetch data from GitHub.
3.  **Testing:** Write tests using **Japa**.
4.  **Auth:** Implement Adonis Opaque Token generation and set it as an HTTP-Only Cookie.

## Specific Logic: The Hybrid Search
* **Lazy Loading Rule:** When implementing search logic, **ALWAYS** query the PostgreSQL DB first.
* **Cache Miss:** Only call the GitHub API (Batch size = 100) if the DB yields 0 or few results.
* **Upsert:** Immediately save GitHub results to the DB before returning them to the frontend.

## Response Guidelines
1.  **Package Manager:** Always use `pnpm` in commands (e.g., `pnpm install`, `pnpm run dev`).
2.  **No Mocks:** Assume the DB and API connections are real and working. Do not generate mock JSON files.
3.  **Concise:** Code first, explain later.
