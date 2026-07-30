# Architecture frontend

## Stack

- **Nuxt 4** — framework SSR/SPA hybride, Vue 3
- **Pinia** — state management
- **@pinia/colada** — couche de query caching sur Pinia (équivalent TanStack Query)
- **@nuxt/ui** + **Tailwind CSS v4** — composants UI et styles
- **Tuyau** — client API type-safe généré depuis les routes AdonisJS
- **marked** + **dompurify** — rendu sécurisé du README Markdown

---

## Initialisation de l'authentification

### `plugins/auth.ts`

Plugin **universel** (s'exécute côté serveur ET côté client). Point d'entrée de l'état auth.

```
SSR (première requête)
  plugins/auth.ts
    ├─ authStore.user existe déjà ? → return (déjà hydraté, cas client)
    └─ authStore.me()
         → $fetch("/auth/me", { headers: useRequestHeaders(["cookie"]) })
              ├─ 200 → authStore.user = userData
              └─ 401 → authStore.user = null (catch silencieux)

  @pinia/nuxt sérialise l'état Pinia dans le payload Nuxt (HTML)

Hydratation client
  Pinia restaure l'état depuis le payload → user déjà disponible
  plugins/auth.ts → if (authStore.user) return → aucun appel réseau

Navigation SPA
  Pinia en mémoire → middlewares lisent isAuthenticated directement
```

**Forwarding de cookies en SSR** : `useRequestHeaders(["cookie"])` est passé à `$fetch` pour que AdonisJS puisse identifier la session lors du rendu côté serveur. Côté client, `credentials: "include"` suffit — le navigateur envoie le cookie automatiquement.

---

## `stores/auth.ts` — Pinia store

Source de vérité unique pour l'état d'authentification.

```typescript
user: Ref<Data.User | null>; // null = anonyme
isAuthenticated: ComputedRef; // true si user !== null
me(); // $fetch GET /auth/me → user.value = data
authenticate(); // retourne l'URL de redirect OAuth
logout(); // DELETE /auth/logout + user.value = null
```

`Data.User` est le type inféré depuis `UserTransformer` via la génération Tuyau — `@gitify/api/data`.

---

## Middlewares de navigation

### `middlewares/auth.ts`

Vérifie `authStore.isAuthenticated`. Si `false`, redirige vers `/`.  
Appliqué sur les pages `explore.vue`, `favorites.vue` et `projects/[id].vue`.

### `middlewares/guest.ts`

Redirige vers `/` si l'utilisateur est déjà authentifié.

---

## Composables

### `useHttp`

Wrapper minimal autour de `$fetch` qui préfixe l'URL avec `NUXT_PUBLIC_API_BASE_URL` et ajoute `credentials: "include"`.

```typescript
const { http } = useHttp();
const data = await http<{ projects: Project[] }>("/projects/feed");
```

### `useFavorite`

Gère l'ajout et le retrait optimistes d'un favori depuis les cartes et le détail d'un projet. Le bouton est bloqué pendant la requête et revient à son état précédent avec un toast si l'appel échoue.

### `usePreferences`

Gère le formulaire de modification des préférences.

- Initialise les champs depuis `authStore.user.preferences` à l'ouverture
- **`savePreferences()`** — `PUT /auth/preferences`, met à jour `authStore.user` avec la réponse
- `availableLanguages` — liste fixe des 11 langages supportés
- `toggleLanguage(lang)` — ajoute ou retire un langage de la sélection

---

## `plugins/tuyau.ts` — client typé

```typescript
const tuyau = createTuyau({
  baseUrl: config.public.apiBaseUrl || "http://localhost:3333",
  registry, // @gitify/api/registry
  credentials: "include",
  headers: useRequestHeaders(["cookie"]), // forwarding SSR
});
```

L'instance est injectée via `provide` sous la clé `tuyau` et accessible dans toute l'application avec `useNuxtApp().$tuyau`.

---

## Queries Pinia Colada (`queries/projects.ts`)

```typescript
export const feedQuery = defineQueryOptions(() => ({
  key: ["projects", "feed"],
  query: () => useApi("/projects/feed"),
}));

export const favoritesQuery = defineQueryOptions(() => ({
  key: ["projects", "favorites"],
  query: () => useApi("/projects/favorites"),
}));
```

Pinia Colada gère la mise en cache, la déduplication des requêtes en vol et l'état `pending` / `error`.

---

## Pages

| Page                | Route           | Auth | Description                                                 |
| ------------------- | --------------- | ---- | ----------------------------------------------------------- |
| `index.vue`         | `/`             | Non  | Page d'accueil, vitrine publique (`GET /projects/showcase`) |
| `explore.vue`       | `/explore`      | Oui  | Fil personnalisé avec ajout et retrait des favoris          |
| `favorites.vue`     | `/favorites`    | Oui  | Liste paginée des projets favoris                           |
| `projects/[id].vue` | `/projects/:id` | Oui  | Détail d'un projet (README, langages, contributeurs)        |
