# Backend

## Routes et rendu

`PagesController` charge les données métier et rend les pages Inertia. `/`, `/explore` et `/projects/:owner/:name` sont publiques : les visiteurs utilisent le token serveur, les utilisateurs connectés leur propre token. `/favorites`, `/profil` et `/preferences` exigent une session ; les visiteurs sont redirigés vers `/`.

Seule la route `/api/projects/:id/favorite` (ajout et retrait d'un favori) répond en JSON ; le fil et les favoris sont des pages Inertia (`/explore`, `/favorites`). Elles utilisent la même session et la même protection CSRF que les pages. Il n'y a plus de configuration CORS ni de documentation OpenAPI pour une API séparée.

## Authentification

`/auth/github/redirect` lance OAuth via Ally ; `/auth/github/callback` vérifie la réponse, crée ou actualise l'utilisateur avec `AuthService`, puis ouvre la session. L'identifiant GitHub, numérique au runtime Ally, est normalisé en chaîne stable : un changement d'email vérifié conserve les préférences et les favoris. La première connexion exige un email vérifié, sans réserver une adresse non vérifiée. Un compte historique (sans identifiant GitHub) est lié dès qu'une connexion présente le même email vérifié par GitHub ; il conserve ses préférences et ses favoris. Si cet email appartient déjà à une autre identité GitHub, la connexion est refusée (409). Un utilisateur reconnu par son identifiant ne prend un nouvel email vérifié que s'il est libre ; sinon il garde l'email enregistré et se connecte normalement. Aucun appel HTTP n'a lieu dans la transaction ; un verrou consultatif par identité GitHub sérialise les premières connexions concurrentes. Le callback redirige vers `/explore` ou `/preferences` selon l'état du profil. `DELETE /auth/logout` ferme la session et redirige vers `/`.

`UserTransformer` expose le profil partagé avec Inertia et exclut le jeton GitHub. Les lectures de projets composent des projections publiques communes aux pages, avec des dates ISO et un état favori propre au lecteur. `ProjectTransformer` définit la projection de liste, qui exclut le README et les détails ; `ProjectDetailTransformer` ajoute les détails et les contributeurs. Le module de lecture retourne leurs objets publics sans exposer Lucid aux contrôleurs. Les types générés sont disponibles dans `.adonisjs/client/data.d.ts`.

## Préférences et projets

`PUT /auth/preferences` utilise Vine pour valider le niveau et les langages, enregistre les préférences et redirige vers l'exploration. Le catalogue partagé `shared/preferences.ts` définit les identifiants et les libellés ; le validator normalise, déduplique et borne les choix. Les identifiants inconnus sont refusés.

`ProjectFeedService` orchestre la vitrine, le fil et les favoris. La sélection s'appuie sur les appartenances aux recherches, indépendantes de l'identité des dépôts. Le fil combine les langages par alternance, sans doublon de dépôt, et renseigne l'état des favoris. Chaque langage vérifie sa fraîcheur, même lorsque le stock global est important. Les projets en cache restent disponibles en cas de panne GitHub ; `refreshState` indique si le résultat est prêt, en cours d'actualisation, dégradé ou indisponible.

La vitrine utilise la même politique de fraîcheur quand un jeton serveur existe. Elle conserve les données en cache lors d'un échec distant et limite l'enrichissement des détails à deux dépôts par requête. Chaque carte reçoit ses deux principaux contributeurs, avec un ordre déterministe.

`GitHubApiClient` appelle GitHub avec un délai borné couvrant la requête et le corps de réponse. Les absences attendues de README ou de release sont distinguées des erreurs ; une réponse 204 des contributeurs représente une liste vide. `GitHubSyncService` accepte un adapter GitHub et une horloge ; les tests fournissent un adapter contrôlé et une base PostgreSQL dédiée. `ensureSearchFresh` vérifie le TTL sous un verrou transactionnel PostgreSQL pour coordonner plusieurs processus. Deux recherches au maximum par processus réservent une connexion pour un appel distant ; les autres servent le résultat en cache avec un état d'actualisation différée. Les échecs reportent la prochaine tentative de 60 secondes, avec une trace partagée en base. Toutes les recherches importent jusqu'à 100 dépôts, y compris celles lancées par la vitrine et le seeder ; les limites de présentation n'altèrent pas le stock du fil. Un import réussi remplace les appartenances du critère ; l'enrichissement remplace les contributeurs et les métadonnées atomiquement. Les limites et durées de cache restent dans `config/gitify.ts`.

La pagination des favoris normalise et ramène les pages à la dernière page disponible, avec un ordre stable par date puis identifiant. Après suppression, le navigateur relit la page canonique.

## Base et configuration

Les modèles et migrations existants sont conservés. Voir [la base de données](database.md). Les variables sont validées dans `start/env.ts` et configurées dans le `.env` racine.
