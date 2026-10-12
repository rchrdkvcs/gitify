# Frontend

Les pages Vue vivent dans `inertia/pages/`. Le premier chargement reçoit le document Edge et les props Inertia ; les navigations suivantes échangent des pages Inertia avec AdonisJS. Le SSR Vue est désactivé.

`inertia/app.ts` initialise Vue et Inertia, installe Nuxt UI via son plugin Vue et applique le layout commun. La page de préférences garde son layout autonome. Nuxt UI fonctionne ici comme bibliothèque de composants Vite ; le framework Nuxt n'est pas utilisé.

## Données et session

La vitrine, le fil, les favoris et le détail de projet sont chargés par `PagesController`. Le middleware Inertia partage le profil public de l'utilisateur et les erreurs de validation. `useAuth` expose ces props de façon réactive ; aucune requête `/auth/me` ni store Pinia n'est nécessaire.

Les formulaires de préférences et de déconnexion utilisent le routeur Inertia. Le serveur valide les données puis redirige vers une page. Les liens Nuxt UI utilisent son intégration Inertia.

Le catalogue filtre et trie côté serveur ; `explore.vue` pousse les filtres dans l'URL et charge les pages suivantes avec `<InfiniteScroll>` d'Inertia (prop `inertia.scroll`). La pagination des favoris effectue une visite Inertia. `useFavorite` utilise les endpoints JSON `/api/projects/:id/favorite` ; `useHttp` envoie le cookie CSRF et les cookies de session sur la même origine.

## Composants et styles

Les composants applicatifs, les composables Vue et les utilitaires sont importés automatiquement par le plugin Vite de Nuxt UI. La configuration visuelle réside dans `inertia/app.config.ts`, et les styles Tailwind dans `inertia/assets/styles/main.css`. Les README sont rendus avec le composant Markdown de Comark pour Vue ; son rendu est asynchrone et doit rester dans un `<Suspense>`.

### Direction artistique

- Un seul thème, sombre : la classe `dark` est posée sur `<html>` dans `resources/views/inertia_layout.edge`.
- Une seule couleur d'accent, le vert menthe (`mint`), réservée aux éléments interactifs, à la sélection et à la marque. Les neutres viennent de la rampe `graphite`. Les deux rampes sont déclarées en `oklch()` dans un bloc `@theme static`, car Nuxt UI les lit au runtime.
- Angles droits partout (`--ui-radius: 0`), aucun dégradé décoratif. La structure passe par des filets d'1px.
- Polices : Geist pour le texte, Geist Mono pour les libellés techniques, chiffres et code.
- Les pages s'empilent en bandes `FrameSection` : un filet horizontal entre chaque bande et deux rails verticaux qui bornent le conteneur. Les grilles de cartes (`ProjectGrid`) partagent leurs filets avec ces rails.
- Le hero de l'accueil (`HeroCommitGraph`) dessine sur un canvas un graphe de commits Git qui défile lentement ; les branches menthe portent un numéro de PR. Il ne s'anime que lorsqu'il est visible et affiche une image fixe sous `prefers-reduced-motion`.
