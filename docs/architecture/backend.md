# Backend

## Routes et rendu

`PagesController` charge les données métier et rend les pages Inertia. Les pages `/explore`, `/favorites`, `/projects/:id`, `/profil` et `/preferences` exigent une session. Les visiteurs sont redirigés vers `/`. Un utilisateur sans préférences est redirigé de l'exploration vers `/preferences`.

Les routes `/api/projects/feed`, `/api/projects/favorites` et `/api/projects/:id/favorite` servent les interactions client. Elles utilisent la même session et la même protection CSRF que les pages. Il n'y a plus de configuration CORS ni de documentation OpenAPI pour une API séparée.

## Authentification

`/auth/github/redirect` lance OAuth via Ally ; `/auth/github/callback` vérifie la réponse, crée ou actualise l'utilisateur avec `AuthService`, puis ouvre la session. Le callback redirige vers `/explore` ou `/preferences` selon l'état du profil. `DELETE /auth/logout` ferme la session et redirige vers `/`.

`UserTransformer` expose le profil partagé avec Inertia et exclut le jeton GitHub. `ProjectTransformer` sérialise les données des projets, leurs dates ISO, les contributeurs et l'état favori. Les types générés de l'utilisateur sont disponibles dans `.adonisjs/client/data.d.ts`.

## Préférences et projets

`PUT /auth/preferences` utilise Vine pour valider le niveau et les langages, enregistre les préférences et redirige vers l'exploration.

`ProjectFeedService` orchestre la vitrine, le fil et les favoris. La vitrine sélectionne des projets par langage dans le cache PostgreSQL. Si le stock est insuffisant et qu'un jeton serveur existe, elle déclenche un enrichissement GitHub. Le fil combine les langages par alternance et renseigne l'état des favoris.

`GitHubApiClient` appelle GitHub ; `GitHubSyncService` importe les repositories et enrichit les détails (README, langages, contributeurs, release). Les seuils, limites et durées de cache restent dans `config/gitify.ts`.

## Base et configuration

Les modèles et migrations existants sont conservés. Voir [la base de données](database.md). Les variables sont validées dans `start/env.ts` et configurées dans le `.env` racine.
