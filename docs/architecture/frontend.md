# Frontend

Les pages Vue vivent dans `inertia/pages/`. Le premier chargement reçoit le document Edge et les props Inertia ; les navigations suivantes échangent des pages Inertia avec AdonisJS. Le SSR Vue est désactivé.

`inertia/app.ts` initialise Vue et Inertia, installe Nuxt UI via son plugin Vue et applique le layout commun. La page de préférences garde son layout autonome. Nuxt UI fonctionne ici comme bibliothèque de composants Vite ; le framework Nuxt n'est pas utilisé.

## Données et session

La vitrine, le fil, les favoris et le détail de projet sont chargés par `PagesController`. Le middleware Inertia partage le profil public de l'utilisateur et les erreurs de validation. `useAuth` expose ces props de façon réactive ; aucune requête `/auth/me` ni store Pinia n'est nécessaire.

Les formulaires de préférences et de déconnexion utilisent le routeur Inertia. Le serveur valide les données puis redirige vers une page. Les liens Nuxt UI utilisent son intégration Inertia.

`useProjects` filtre, trie et révèle progressivement les projets reçus. La pagination des favoris effectue une visite Inertia. `useFavorite` utilise les endpoints JSON `/api/projects/:id/favorite` ; `useHttp` envoie le cookie CSRF et les cookies de session sur la même origine.

## Composants et styles

Les composants applicatifs, les composables Vue et les utilitaires sont importés automatiquement par le plugin Vite de Nuxt UI. La configuration visuelle réside dans `inertia/app.config.ts`, et les styles Tailwind dans `inertia/assets/styles/main.css`. Les README sont rendus avec le composant Markdown de Comark pour Vue.

Les modèles 3D restent dans `public/models/`. La séquence clavier GITIFY ouvre les archives pour les utilisateurs connectés sur ordinateur. Three.js est chargé à la demande ; le raccourci et l'overlay sont initialisés depuis l'entrée Vue.
