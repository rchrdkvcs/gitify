# Lessons

## Nuxt dev — `IPC connection closed` is always a masked error

**Symptom** — `nuxt dev` returns 500 on every SSR request with
`Error: IPC connection closed` at `@nuxt/vite-builder/dist/vite-node.mjs`.

**It is never the real error.** The vite-node client multiplexes all SSR module
requests over one Unix socket. When *any single* module transform fails, the
client's retry loop calls `clientSocket.destroy()`, which rejects every other
in-flight request with `IPC connection closed`. The genuine error is swallowed
by `server.on("error", () => {})` and an empty `catch` in `sendError`.

**How to find the real error** — instrument the two dist files
(`index.mjs` server side, `vite-node.mjs` client side) with tagged logs on
`sendError`, `sendResponse`, and socket `close`/`end`. Back up the files first,
restore after. The failing `moduleId` shows up immediately.

**Case seen (2026-07-27)** — `apps/api/node_modules` was never installed, so
`apps/api/tsconfig.json`'s `extends: "@adonisjs/tsconfig/tsconfig.app.json"`
was unresolvable. `apps/web` imports `@gitify/api/registry` → a `.ts` file under
`apps/api/.adonisjs/`, Vite loads the nearest tsconfig to transform it, fails,
and the whole SSR pipeline collapses into `IPC connection closed`.

**Rule** — in this monorepo always run `pnpm install` at the **root**, never
scoped to one workspace. `apps/web` compiles TypeScript that lives in
`apps/api`, so the API's devDependencies are required to boot the web dev server.

**Rule** — do not "fix" `IPC connection closed` by guessing at config
(`vite.ssr.external`, `optimizeDeps`). Reproduce with a scripted
boot → `curl /` → grep loop, then instrument. Guessing cost a full round of
speculative changes here.
