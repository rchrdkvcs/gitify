# Frontend

Les pages Vue vivent dans `inertia/pages/`. Le premier chargement reçoit le document Edge et les props Inertia ; les navigations suivantes échangent des pages Inertia avec AdonisJS. Le premier chargement est rendu côté serveur par `inertia/ssr.ts`, puis `inertia/app.ts` hydrate le HTML reçu. Le code exécuté au rendu (setup des composants) ne doit donc pas lire `window` ni `document` : réserver ces accès à `onMounted` ou aux gestionnaires d’événements.

`inertia/app.ts` initialise Vue et Inertia, installe Nuxt UI via son plugin Vue et applique le layout commun. La page d'onboarding garde son layout autonome. Nuxt UI fonctionne ici comme bibliothèque de composants Vite ; le framework Nuxt n'est pas utilisé.

## Données et session

La vitrine, le fil, les favoris et le détail de projet sont chargés par `PagesController`. Le middleware Inertia partage le profil public de l'utilisateur et les erreurs de validation, et transmet le message d'erreur flashé (`flash.error`) que le layout affiche en toast. Les erreurs HTTP passent par `app/exceptions/handler.ts` : page Inertia `errors/not_found` ou `errors/error`, JSON `{ error: { code, message } }` pour `/api/*`, redirection vers `/` avec message flashé pour les échecs OAuth. `useAuth` expose ces props de façon réactive ; aucune requête `/auth/me` ni store Pinia n'est nécessaire.

Les formulaires de préférences et de déconnexion utilisent le routeur Inertia. `usePreferenceDraft` fournit la copie éditable des préférences (amorçage, bascule des listes, enregistrement) à la page de préférences et à l'onboarding, qui y ajoute sa navigation (`useOnboardingFlow`) ; les champs (`components/preferences/`) sont partagés par l'onboarding et la page de préférences. Le serveur valide les données puis redirige vers une page. Les liens Nuxt UI utilisent son intégration Inertia.

Le catalogue filtre et trie côté serveur ; `explore.vue` pousse les filtres dans l'URL et charge les pages suivantes avec `<InfiniteScroll>` d'Inertia (prop `inertia.scroll`). `issues.vue` suit le même modèle pour le fil d'issues (`IssueCard`, prop `issues`) ; la barre de langages est partagée avec le catalogue via `LanguageFilterTabs`. La pagination des favoris effectue une visite Inertia. `useFavorite` utilise les endpoints JSON `/api/projects/:id/favorite` ; `lib/http.ts` envoie le cookie CSRF et les cookies de session sur la même origine.

## Types partagés

`shared/types` est le seul contrat de données entre serveur et client : les transformers déclarent le type de retour de `toObject()` (`AuthUser`, `Project`, `FeedIssue`…) et les pages, composants et composables importent ces mêmes types. Les types `Data.*` générés dans `.adonisjs/client/data.d.ts` ne sont pas utilisés côté client. Les unions métier (`ExperienceLevel`, `ContributionType`, `IssueKind`, `PreferenceLanguage`) sont dérivées des catalogues de `shared/preferences.ts` et `shared/issues.ts` : ajouter une valeur au catalogue suffit.

## Onboarding

`pages/onboarding.vue` pose une question par écran : grandes cartes sélectionnables (groupes de boutons radio ou de cases natives), stepper numéroté (`OnboardingStepper`, étapes terminées, courante et à venir, les étapes atteintes restent cliquables), pied de page Retour / Continuer collant sur mobile. Chaque réponse confirmée part en arrière-plan (`PATCH /api/onboarding`) sans bloquer la transition. Au changement d'étape, le focus passe au titre de la question pour les lecteurs d'écran ; les erreurs sont annoncées dans une région `aria-live`.

Chaque étape a son illustration SVG en ligne (`components/onboarding/OnboardingArt*.vue`), dans le vocabulaire du landing (`.ill`, filets de 1,5 px, carrés, accent menthe) et réactive aux choix : le chemin se trace jusqu'au niveau choisi, les étiquettes et puces sélectionnées s'allument. Le mouvement reste court (`.ill-draw`, `.ill-pop`, `.ill-pulse` limité à trois cycles, dans `main.css`) ; les transitions entre étapes durent 120 à 220 ms, orientées selon le sens de navigation, et se réduisent à un fondu sous `prefers-reduced-motion`. L'écran de fin lance une courte salve de confettis carrés (`lib/confetti.ts`, canvas, retirée après 4 s), uniquement depuis `onMounted` et jamais sous mouvement réduit.

## Score d'accueil

`NewcomerScoreMeter` dessine le score en dix segments. Les cartes du catalogue affichent une ligne « Accueil » (« ≈ » pour une estimation partielle, « Non évalué » sinon). La fiche projet montre le résumé dans la colonne latérale (`ProjectNewcomerScore`) et le détail des signaux dans l'onglet « Contribuer » (`ProjectNewcomerBreakdown`). Les libellés des signaux viennent de `shared/newcomer_score.ts`.

## Composants et styles

Les composants applicatifs, les composables Vue et les utilitaires sont importés automatiquement par le plugin Vite de Nuxt UI. La configuration visuelle réside dans `inertia/app.config.ts`, et les styles Tailwind dans `inertia/assets/styles/main.css`. Les README sont rendus avec le composant Markdown de Comark pour Vue ; son rendu est asynchrone et doit rester dans un `<Suspense>`.

### Direction artistique

- Un seul thème, sombre : la classe `dark` est posée sur `<html>` dans `resources/views/inertia_layout.edge`.
- Une seule couleur d'accent, le vert menthe (`mint`), réservée aux éléments interactifs, à la sélection et à la marque. Les neutres viennent de la rampe `graphite`. Les deux rampes sont déclarées en `oklch()` dans un bloc `@theme static`, car Nuxt UI les lit au runtime.
- Angles droits partout (`--ui-radius: 0`), aucun dégradé décoratif. La structure passe par des filets d'1px.
- Polices : Geist pour le texte, Geist Mono pour les libellés techniques, chiffres et code.
- Les pages s'empilent en bandes `FrameSection` : un filet horizontal entre chaque bande et deux rails verticaux qui bornent le conteneur. Les grilles de cartes (`ProjectGrid`) partagent leurs filets avec ces rails.
- Le hero de l'accueil (`HeroCommitGraph`) dessine sur un canvas un graphe de commits Git qui défile lentement ; les branches menthe portent un numéro de PR. Il ne s'anime que lorsqu'il est visible et affiche une image fixe sous `prefers-reduced-motion`.
