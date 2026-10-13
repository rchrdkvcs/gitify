# Backend

## Routes et rendu

`PagesController` charge les données métier et rend les pages Inertia. `/`, `/explore`, `/issues` et `/projects/:owner/:name` sont publiques : les visiteurs utilisent le token serveur, les utilisateurs connectés leur propre token. `/favorites`, `/profil`, `/preferences` et `/onboarding` exigent une session ; les visiteurs sont redirigés vers `/`.

Seules les routes `/api/projects/:id/favorite` (ajout et retrait d'un favori) et `/api/onboarding` (réponse enregistrée en arrière-plan) répondent en JSON ; le fil et les favoris sont des pages Inertia (`/explore`, `/favorites`). Elles utilisent la même session et la même protection CSRF que les pages. Il n'y a plus de configuration CORS ni de documentation OpenAPI pour une API séparée.

## Authentification

`/auth/github/redirect` lance OAuth via Ally ; `/auth/github/callback` vérifie la réponse, crée ou actualise l'utilisateur avec `AuthService`, puis ouvre la session. L'identifiant GitHub, numérique au runtime Ally, est normalisé en chaîne stable : un changement d'email vérifié conserve les préférences et les favoris. La première connexion exige un email vérifié, sans réserver une adresse non vérifiée. Un compte historique (sans identifiant GitHub) est lié dès qu'une connexion présente le même email vérifié par GitHub ; il conserve ses préférences et ses favoris. Si cet email appartient déjà à une autre identité GitHub, la connexion est refusée (409). Un utilisateur reconnu par son identifiant ne prend un nouvel email vérifié que s'il est libre ; sinon il garde l'email enregistré et se connecte normalement. Aucun appel HTTP n'a lieu dans la transaction ; un verrou consultatif par identité GitHub sérialise les premières connexions concurrentes. Le callback redirige vers `/onboarding` tant que le parcours guidé n'est ni terminé ni reporté, sinon vers `/explore` (`OnboardingService.landingPath`). `DELETE /auth/logout` ferme la session et redirige vers `/`.

`UserTransformer` expose le profil partagé avec Inertia et exclut le jeton GitHub. Les lectures de projets composent des projections publiques communes aux pages, avec des dates ISO et un état favori propre au lecteur. `ProjectTransformer` définit la projection de liste, qui exclut le README et les détails ; `ProjectDetailTransformer` ajoute les détails et les contributeurs. Le module de lecture retourne leurs objets publics sans exposer Lucid aux contrôleurs. Chaque transformer type le retour de `toObject()` avec le contrat de `shared/types`.

## Onboarding et préférences

`shared/preferences.ts` est la source unique des choix possibles : `languageCatalog`, `experienceLevelCatalog` (avec le niveau de recherche GitHub associé), `contributionTypeCatalog` et `topicSuggestions`. Il fournit aussi `difficultyForLevel` et `normalizePreferenceLanguages`. `shared/stored_preferences.ts` porte `normalizeUserPreferences` (lit l'ancien et le nouveau format), `shared/language_inference.ts` porte `inferPreferredLanguages` et `shared/preference_summary.ts` porte `summarizePreferences` (libellés affichés par le profil et l'écran de fin). Toute fonctionnalité qui a besoin du niveau, des langages ou des façons de contribuer d'un utilisateur lit `user.preferences` (déjà normalisé par le modèle) et ces helpers.

`OnboardingController` et `OnboardingService` gèrent le parcours :

`shared/onboarding.ts` est la source unique du parcours : liste des étapes et champ de préférence auquel chacune répond, bornes, reprise, transitions et enregistrement d'une réponse. Le validator en dérive ses bornes, la page en dérive son affichage.

- `GET /onboarding` rend la page avec la question de reprise et une prop différée `suggestedLanguages`, calculée depuis les dépôts de l'utilisateur (`GET /user/repos`) ; un échec GitHub ne donne simplement aucune suggestion.
- `PATCH /api/onboarding` (JSON) enregistre une réponse confirmée et l'étape atteinte. La réponse doit porter exactement le champ de son étape, sinon 422.
- `PUT /onboarding` valide toutes les réponses, les enregistre et renseigne `onboarded_at`.
- `POST /onboarding/skip` renseigne `onboarding_skipped_at` et redirige vers le catalogue.

`PUT /auth/preferences` valide les mêmes champs avec Vine et passe par le même `OnboardingService.completeWith` que `PUT /onboarding` : il enregistre les préférences, termine l'onboarding s'il ne l'était pas et redirige vers l'exploration. Les validators normalisent, dédupliquent et bornent les choix ; les identifiants inconnus sont refusés. Les critères des fils (`app/feed_criteria/`) dérivent les filtres par défaut des préférences.

## Score d'accueil des débutants

`shared/newcomer_score.ts` est un module pur : `computeNewcomerScore(input, now)` applique des poids explicites (`newcomerScoreWeights`) et des règles de normalisation (`newcomerScoreRules`), puis retourne le score, sa couverture et le détail de chaque signal (valeur, ratio, points). `newcomerScoreInputFromInsights` lit un instantané `insights`, y compris ceux antérieurs au score.

La requête GraphQL des détails récupère en plus les 25 dernières issues et PR avec leurs premiers commentaires et revues, la dernière PR fusionnée et l'assignation des « good first issue ». `assembleRepositorySnapshot` (`app/services/github/repository_snapshot.ts`) en déduit `insights.contributorActivity` via `summarizeContributorActivity` (`app/services/github/contributor_activity.ts`) : médiane de première réponse d'un mainteneur, PR externes fusionnées ou fermées. `storeRepositorySnapshot` (`app/services/github/repository_snapshot_store.ts`), appelé par `GitHubSyncService.fetchProjectDetails`, calcule le score dans la même transaction que l'instantané et l'enregistre dans `newcomer_score` et `newcomer_score_details`. Le catalogue trie par `newcomer_score DESC NULLS LAST`, filtre par score minimal et exclut les dépôts archivés.

## Projets

`ProjectFeedService` orchestre la vitrine, le fil et les favoris. La sélection s'appuie sur les appartenances aux recherches, indépendantes de l'identité des dépôts. Le fil combine les langages par alternance, sans doublon de dépôt, et renseigne l'état des favoris. Chaque langage vérifie sa fraîcheur, même lorsque le stock global est important. Les projets en cache restent disponibles en cas de panne GitHub ; `refreshState` indique si le résultat est prêt, en cours d'actualisation, dégradé ou indisponible.

La vitrine utilise la même politique de fraîcheur quand un jeton serveur existe. Elle conserve les données en cache lors d'un échec distant et limite l'enrichissement des détails à deux dépôts par requête. Chaque carte reçoit ses deux principaux contributeurs, avec un ordre déterministe.

`GitHubApiClient` compose l'adapter GitHub : `GitHubTransport` (délai borné couvrant la requête et le corps de réponse, issues déclarées par endpoint comme `absent`, `empty` ou `pending`), les requêtes GraphQL (`github_queries.ts`) et un mapper par endpoint. Il renvoie un dépôt normalisé unique (`GitHubRepository`, licence `NOASSERTION` remplacée par son nom, page d'accueil vide à `null`) pour les deux recherches, et un instantané complet (`getRepositorySnapshot`) qui échoue entièrement si l'une de ses parties échoue. Les échecs sont typés (`github_errors.ts`) : `GitHubAuthError` (401, 403 sans quota), `GitHubRateLimitError` (429 ou 403 avec quota épuisé, avec heure de reprise), `GitHubUnavailableError` (5xx, délai, réseau), `GitHubNotFoundError`, `GitHubInvalidResponseError`. Les absences attendues de README ou de release sont distinguées des erreurs ; une réponse 204 des contributeurs représente une liste vide. `GitHubSyncService` et `OnboardingService` acceptent un adapter GitHub et une horloge ; les tests fournissent un adapter contrôlé (`tests/helpers/fake_github_adapter.ts`) et une base PostgreSQL dédiée. `ensureSearchFresh` vérifie le TTL sous un verrou transactionnel PostgreSQL pour coordonner plusieurs processus. Deux recherches au maximum par processus réservent une connexion pour un appel distant ; les autres servent le résultat en cache avec un état d'actualisation différée. Les échecs reportent la prochaine tentative de 60 secondes, avec une trace partagée en base. Toutes les recherches importent jusqu'à 100 dépôts, y compris celles lancées par la vitrine et le seeder ; les limites de présentation n'altèrent pas le stock du fil. Un import réussi remplace les appartenances du critère ; l'enrichissement remplace les contributeurs et les métadonnées atomiquement. Les limites et durées de cache restent dans `config/gitify.ts`.

## Fil d'issues

`IssueFeedService` sert `/issues`. `parseIssueFilters` (`app/feed_criteria/issue_criteria.ts`) et `parseExploreFilters` (`explore_criteria.ts`) sont deux configurations de `defineFeedCriteria` (`feed_criteria.ts`) : un descripteur par filtre (paramètre, lecture, valeur issue des préférences). Un filtre présent dans la query string, même vide, remplace la préférence correspondante ; un filtre absent la reprend. Le catalogue `shared/issues.ts` définit les types d'issue (`good-first-issue`, `help-wanted`, `documentation`), le label GitHub recherché pour chacun, le type de contribution et le niveau qu'il sert (`defaultIssueKind`), et la lecture des signaux depuis les labels. Les langages viennent de `shared/preferences.ts`.

`GitHubIssueSyncService` reprend la politique de fraîcheur des recherches de dépôts pour chaque couple `(language, kind)` : TTL de 6 heures (`cache.issueFetchTtlHours`), verrou consultatif PostgreSQL, budget de recherches distantes partagé avec `GitHubSyncService` (`tryAcquireSearchPermit`) et report de 60 secondes après un échec. L'adapter appelle `searchIssues`, une recherche GraphQL qui renvoie l'issue et son dépôt. L'import écarte les dépôts archivés ou privés et les issues fermées par une pull request ouverte (`closedByPullRequestsReferences`), enregistre ou met à jour le dépôt sous le même verrou d'identité que les recherches de dépôts, puis remplace les appartenances du critère. Les issues qu'aucune recherche ne liste plus sont supprimées ; les verrous par issue empêchent un autre critère de les rattacher pendant ce nettoyage. Seule la première page déclenche ces actualisations ; `refreshState` a la même signification que pour le catalogue. `IssueTransformer` définit la carte transmise au navigateur.

La pagination des favoris normalise et ramène les pages à la dernière page disponible, avec un ordre stable par date puis identifiant. Après suppression, le navigateur relit la page canonique.

## Base et configuration

Les modèles et migrations existants sont conservés. Voir [la base de données](database.md). Les variables sont validées dans `start/env.ts` et configurées dans le `.env` racine.
