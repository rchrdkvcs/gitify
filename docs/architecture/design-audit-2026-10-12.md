# Audit de conception — Gitify

Audit du 12 octobre 2026, sur le commit `3df6cac`, avec le skill `codebase-design`.

> **Statut (13 octobre 2026) :** document historique. Tous les points sont traités ; les chemins et numéros de ligne cités ne correspondent plus au code. La revue d'architecture du 13 octobre (branche `refactor/architecture-review`) a ensuite unifié la politique de fraîcheur, découpé les fils, l'adapter GitHub et l'onboarding.

Le projet possède une structure adaptée à sa taille : rendu Inertia, logique de sélection côté serveur, état de session partagé et chargement différé de Three.js. Les difficultés principales viennent des invariants que les interfaces ne prennent pas encore en charge : fraîcheur des données, appartenance des dépôts aux niveaux, cohérence des imports et durée de vie des opérations asynchrones.

La priorité est de rendre ces invariants locaux à leurs modules. Une multiplication de dossiers ou d’interfaces génériques apporterait peu de profondeur.

## Périmètre et vérification

Examen des modules serveur, modèles, migrations, validators, transformers, composables, pages, modules graphiques, configuration, documentation et CI. Audit de conception et de comportement ; pas d’audit exhaustif de sécurité des dépendances ni de validation visuelle au navigateur.

Contrôles exécutés sur Node.js 26.7.0 et pnpm 12.11.2 : installation avec lockfile figé, lint, formatage, compilation, vérification TypeScript, migrations et tests sur un PostgreSQL 17 jetable. La CI utilise Node.js 24 ; cette version n’a pas été exécutée pendant cet audit.

Résultat : lint, formatage, build et typecheck réussis ; les 14 tests existants et sept vérifications temporaires passent. Ces dernières confirment l’écrasement du niveau, l’effacement du cache sur 503, le rejet du fil malgré son cache, l’absence de rafraîchissement avec 25 projets, la limite globale des contributeurs, les projets dupliqués et les métadonnées de page invalides. Les fichiers de vérification et l’environnement jetable ont été retirés après exécution.

Le build émet un avertissement de taille sur le morceau différé `archive-scene` : environ 625 ko minifiés, 158 ko compressés. Cela justifie une mesure à l’ouverture des archives, sans démontrer un problème de chargement initial.

Les vérifications temporaires caractérisent le comportement actuel, y compris ses défauts. Leur réussite ne signifie donc pas que les défauts sont corrigés. Aucun refactoring applicatif n’est inclus dans cet audit.

## P1 — Corriger les invariants qui peuvent altérer les données ou les ressources

### 1. Un échec GitHub peut effacer des détails valides et renouveler leur fraîcheur

**Sources :** `app/services/github/github_api_client.ts:93`, `app/services/github/github_sync_service.ts:70`.

Toutes les réponses HTTP non réussies des endpoints de détails deviennent `null`, `[]` ou `0`. L’import écrit ensuite ces valeurs et actualise `detailsFetchedAt`, même si GitHub a répondu 503. Le module ne distingue pas une absence normale, comme l’absence de release, d’une indisponibilité ou d’un refus d’accès.

**Conséquence :** un README en cache peut disparaître et rester considéré comme frais pendant sept jours. Les anciens contributeurs, eux, restent présents : le même projet peut afficher zéro contributeur au total avec une liste non vide.

**Vérification exécutée :** cinq réponses 503 simulées, sur un projet possédant déjà README, langages et contributeur. Après import : README et langages effacés, total à zéro, cache déclaré frais et ancien contributeur conservé.

**Proposition :** faire porter au module de récupération une interface qui distingue résultat présent, absence attendue et échec. Préserver les anciennes valeurs lors d’un échec ; ne renouveler la fraîcheur que selon une politique explicite. Les délais d’attente et la classification des erreurs doivent rester dans son implementation.

**Test cible :** une réponse 503 conserve les détails précédents et permet une nouvelle tentative ; une absence attendue reste représentable.

### 2. Le niveau d’un dépôt dépend du dernier import

**Sources :** `app/services/github/github_sync_service.ts:36`, `database/migrations/1769697577125_create_create_projects_table.ts:12`, `app/services/project_feed_service.ts:100`.

L’unicité du dépôt repose sur `githubRepoId`, mais `difficulty` est écrasé avec le niveau de chaque recherche. Un dépôt trouvé dans les deux recherches ne peut appartenir qu’à un seul niveau à la fois. Le seeder de vitrine et les visites utilisateur peuvent donc modifier le classement utilisé par les autres visiteurs.

**Vérification exécutée :** importer le même dépôt en `beginner`, puis en `expert`. Il disparaît de la sélection débutante, tandis que le cache de recherche débutant reste frais.

**Proposition :** séparer l’identité du dépôt de son appartenance aux sélections. Un dépôt garde ses métadonnées ; une association représente ses niveaux ou son appartenance aux résultats de recherche. Définir aussi la politique de retrait quand un résultat cesse d’être éligible.

**Test cible :** importer les deux niveaux dans les deux ordres produit les mêmes sélections et conserve une seule identité de dépôt et ses favoris.

### 3. La fraîcheur du cache et le déclenchement des imports sont répartis entre les appelants

**Sources :** `app/services/project_feed_service.ts:19`, `app/services/project_feed_service.ts:85`, `app/services/github/github_sync_service.ts:9`.

Le fil ne vérifie le TTL que si le nombre total de projets disponibles est inférieur à 25. Avec 25 projets TypeScript et aucun projet Rust, aucun import Rust n’est déclenché. Avec un stock suffisant, une recherche expirée peut ne jamais être renouvelée par le fil.

La vitrine déclenche directement `fetchAndStore` quand son stock est faible, sans vérifier le TTL. Elle n’importe pas les détails, alors que ses cartes affichent release et contributeurs. Plusieurs visites peuvent déclencher les mêmes imports. Le couple `needsFetch` puis `fetchAndStore` impose aussi un ordre aux appelants sans empêcher deux requêtes concurrentes de passer le contrôle.

**Vérification exécutée :** cache TypeScript vieux de dix jours, 25 projets et préférence supplémentaire Rust. Aucun appel à la recherche GitHub ; le TTL expiré est pourtant détectable par `needsFetch`.

**Proposition :** remplacer la connaissance de cet ordre par une opération telle que `ensureSearchFresh(criteria)` dans le module de synchronisation. Elle possède fraîcheur, besoin par langage, déduplication des opérations en cours et politique de retour des données en cache. La vitrine conserve sa politique de sélection ; elle utilise la même interface de fraîcheur. En déploiement multiprocessus, la coordination doit aussi fonctionner entre processus.

**Tests cibles :** langage absent malgré un stock global suffisant, TTL expiré, import concurrent et stock faible après une recherche récente.

### 4. La fermeture des archives ne possède pas les initialisations encore en cours

**Sources :** `inertia/components/archive/ArchiveRoomOverlay.vue:26`, `inertia/composables/useArchiveEasterEgg.ts:109`, `inertia/lib/archive-scene.ts:405`.

`mountScene` attend l’import dynamique puis les modèles GLB. Pendant ces attentes, `teardownScene` ne possède aucun handle à libérer. Après fermeture, l’opération peut reprendre, créer son renderer, enregistrer ses écouteurs et démarrer sa boucle sur un canvas détaché. Deux ouvertures successives peuvent aussi se disputer `sceneHandle`. Le chargement des projets ne distingue pas davantage deux sessions d’ouverture.

Le renderer et l’environnement sont créés avant le chargement des GLB. Si celui-ci échoue, le module ne retourne pas de handle et ne libère pas ces ressources. Le nettoyage normal libère geometries et materials, mais ne parcourt pas leurs textures ; le template de meuble, absent de la scène finale, n’est pas intégralement couvert.

**Statut :** chemins identifiés par lecture du code ; reproduction WebGL au navigateur non effectuée.

**Proposition :** une génération d’ouverture ou un signal d’annulation doit invalider les résultats tardifs. Un handle reçu après invalidation est immédiatement libéré. Le module graphique possède le nettoyage de tout ce qu’il alloue, y compris si sa création échoue. Les ressources partagées entre clones sont libérées une seule fois. L’interface externe peut rester petite : création, redimensionnement et libération.

**Tests cibles :** fermeture pendant l’import, pendant les GLB, réouverture immédiate et échec d’un modèle. Observer le nombre de boucles et d’écouteurs encore actifs après fermeture.

## P2 — Améliorer la cohérence et la profondeur des interfaces

### 5. Le fil abandonne les projets en cache dès qu’un import échoue

**Source :** `app/services/project_feed_service.ts:87`.

L’import GitHub est attendu avant la lecture finale. Son rejet interrompt `getFeed`, même si PostgreSQL contient des projets utilisables. La tolérance aux erreurs diffère du détail de projet, qui intercepte l’erreur et continue.

**Vérification exécutée :** un projet déjà stocké et une recherche distante simulée en échec font rejeter `getFeed`.

**Proposition :** définir le comportement dégradé dans l’interface du fil : retourner les projets disponibles et un état de rafraîchissement explicite, ou réserver l’échec aux cas réellement inutilisables. Ajouter un délai d’attente borné dans le module GitHub.

### 6. L’enrichissement n’est ni atomique ni un remplacement cohérent des contributeurs

**Source :** `app/services/github/github_sync_service.ts:73`.

Le projet est sauvegardé avec sa fraîcheur avant les écritures des contributeurs. Une erreur sur ces écritures laisse un projet frais et partiellement enrichi. Les contributeurs absents du résultat suivant ne sont jamais supprimés ; la liste peut accumuler des personnes sorties du classement.

**Proposition :** préparer le résultat distant, puis appliquer les métadonnées, le remplacement des contributeurs et la fraîcheur dans une même transaction locale. Préciser si la liste représente les premiers contributeurs actuels ou un historique : le code de récupération indique aujourd’hui un classement courant.

**Tests cibles :** erreur d’écriture au milieu de l’import et remplacement d’une liste A/B par B/C.

### 7. La limite des contributeurs de vitrine est globale au groupe de projets

**Source :** `app/services/project_feed_service.ts:15`.

Le preload utilise `limit(2)`, ce qui limite les lignes de la requête relationnelle pour l’ensemble du pool de ce langage. Il ne sélectionne pas deux contributeurs par projet.

**Vérification exécutée :** deux projets avec deux contributeurs chacun ne reçoivent que deux contributeurs au total dans la vitrine.

**Proposition :** appliquer une limite par projet avec le mécanisme relationnel de groupe de Lucid, et un classement déterministe en cas d’égalité. Ce détail doit rester local au module qui compose la vitrine.

### 8. Le contrat de lecture des projets varie selon le transport

**Sources :** `app/controllers/project_controller.ts:19`, `app/controllers/project_controller.ts:26`, `app/controllers/pages_controller.ts:24`, `app/transformers/project_transformer.ts:6`, `shared/types/project.ts`.

Les pages utilisent `ProjectTransformer`, tandis que les réponses JSON sérialisent directement les modèles. Le transformer commun renvoie un `ProjectDetail` même pour les listes : README, langages et autres détails déjà stockés peuvent être transmis avec chaque carte. L’interface de `ProjectFeedService` retourne aussi tantôt des modèles, tantôt un paginator de relations, tantôt un objet de vitrine.

`isFavorite` est un état propre au lecteur ajouté au modèle persistant ; sa présence et le chargement des relations deviennent des invariants implicites pour les serializers.

**Proposition :** partager des projections explicites de liste et de détail entre les deux transports. Garder Lucid dans l’implementation du module de lecture et composer l’état favori dans le résultat destiné au lecteur. Une projection étroite pour les archives suffit à leur usage.

**Tests cibles :** comparer les champs publics du fil Inertia et JSON, vérifier les dates et l’absence de README dans les listes.

### 9. Les préférences ne garantissent pas les invariants utilisés par le fil

**Sources :** `app/validators/update_preferences_validator.ts:10`, `app/services/project_feed_service.ts:83`, `inertia/utils/constants.ts:29`, `config/gitify.ts:31`.

Le validator normalise la casse mais ne déduplique pas les langages, ne limite pas leur nombre et ne définit pas leur vocabulaire. Le fil crée une recherche et une sélection par entrée. Les catalogues de langages sont par ailleurs répartis entre formulaire, vitrine et formatage, avec des ensembles différents.

**Vérification exécutée :** deux préférences `typescript` produisent deux occurrences du même projet dans le fil.

**Proposition :** définir un type métier de préférences normalisées, une politique explicite de langages supportés ou libres, une déduplication et une limite de taille. Un catalogue commun peut porter identifiants et libellés ; le sous-ensemble de vitrine reste une configuration distincte.

**Tests cibles :** casse mixte, doublons, chaîne vide, valeur inconnue et nombre excessif de langages.

### 10. La pagination des favoris a plusieurs propriétaires

**Sources :** `app/controllers/pages_controller.ts:28`, `app/controllers/project_controller.ts:23`, `inertia/pages/favorites.vue:46`.

Le contrôleur de page arrondit le numéro et applique un fallback ; le contrôleur JSON ne le fait pas. Une entrée non numérique peut devenir `NaN`. Côté Vue, supprimer un favori décrémente `total`, sans recalculer `lastPage`, remplacer l’entrée depuis la page suivante ou corriger une dernière page devenue vide. Une liste vide peut ainsi afficher « Aucun favori » alors que d’autres pages contiennent encore des projets.

**Vérification exécutée :** `/api/projects/favorites?page=abc`, avec un favori existant, répond 200 avec `meta.currentPage: null` et un avertissement de construction de l’offset. Cela confirme un contrat de pagination incohérent ; aucun échec 500 n’a été observé sur ce cas.

**Proposition :** une règle commune valide les numéros finis et entiers. Après mutation, recharger une projection canonique de la page, avec correction de la page courante, ou conserver une suppression optimiste suivie de cette réconciliation. Ajouter un ordre secondaire stable sur l’identifiant pour les dates égales.

**Tests cibles :** numéro invalide, page fractionnaire, page hors intervalle et suppression du dernier élément de la dernière page.

## P3 — Simplifications et points de vigilance

### 11. La seam GitHub mérite un adapter de test explicite

**Sources :** `app/services/github/*.ts`, `tests/functional/inertia.spec.ts`.

Les méthodes statiques dépendent directement de `fetch`, de l’horloge et des modèles. Les tests existants évitent GitHub en préparant un cache frais ; ils vérifient les parcours HTTP, mais pas les politiques d’import et de fraîcheur. Les vérifications de cet audit ont dû remplacer temporairement une méthode statique ou `globalThis.fetch`, puis restaurer leur valeur.

**Proposition :** le module de synchronisation accepte un adapter GitHub de production et un adapter contrôlable en test ; cette seam a une variation réelle. L’horloge peut rester une seam interne. PostgreSQL se teste avec une base dédiée : une interface générique de repository n’est pas nécessaire pour chaque modèle.

Les tests de comportement doivent traverser l’interface utilisée par les appelants et survivre à une réorganisation interne. Une fois les tests du module approfondi présents, remplacer les tests redondants plutôt que les empiler.

### 12. Réduire les interfaces inutiles et concentrer les connaissances répétées

- `ArchiveSceneHandle.clearSelection` n’est jamais appelé et son implementation est vide (`inertia/lib/archive-scene.ts:773`). Le supprimer réduit ce qu’un appelant doit comprendre.
- `ProjectGroup` est uniquement un alias de `ShowcaseLanguageResult` (`inertia/types/projects.ts:2`). Utiliser le nom partagé évite une seconde terminologie sans comportement supplémentaire.
- `usePreferences` expose `isEditingPreferences`, qu’aucun appelant actuel ne lit. Réduire sa surface au formulaire réellement utilisé.
- Le hero possède bien sa boucle et son nettoyage. Cependant, `visibilitychange` redémarre la boucle au retour dans l’onglet sans mémoriser si le hero est encore à l’écran (`HeroCommitGraph.vue:343`). Conserver cette condition dans l’implementation ; un module d’animation générique ne serait pas justifié pour ce seul usage.
- `AuthService` centralise l’upsert, mais l’identité persistante repose sur l’email (`auth_service.ts:16`). Évaluer l’identifiant GitHub stable pour conserver préférences et favoris si l’email change. Ce point est une amélioration de modèle, pas une vulnérabilité démontrée.
- Les migrations ne définissent pas d’index correspondant à la sélection `(difficulty, language, stars)` du fil. Vérifier les plans d’exécution sur un volume représentatif avant une migration d’index ; aucun ralentissement n’a été mesuré ici.

## Ce qui mérite d’être conservé

`useAuth` masque correctement l’accès aux props Inertia et évite un second état de session. `useFavorite` concentre la mutation optimiste, la protection contre les clics répétés et le rollback. `useProjects` concentre filtres, tri et révélation progressive sans I/O. Le module graphique garde Three.js derrière une création et un handle ; sa longueur ne suffit pas à justifier un découpage public.

`UserTransformer` et son test d’absence du jeton donnent une interface publique explicite. Les contrôleurs restent courts. Les contraintes d’unicité et les suppressions en cascade portent déjà une partie des invariants dans PostgreSQL. La CI couvre les contrôles de base.

Les modules visuels courts comme `FrameSection` et `ProjectGrid` ont de la locality : les supprimer redistribuerait les règles de présentation dans leurs appelants. Leur faible taille n’en fait pas automatiquement des abstractions inutiles.

## Ordre de travail proposé

1. Préserver le cache sur erreur et rendre l’enrichissement cohérent, avec des tests à l’interface du module de synchronisation.
2. Stabiliser l’identité des dépôts et leur appartenance aux niveaux, puis centraliser fraîcheur et coordination des imports.
3. Posséder et annuler les sessions d’archives, avec nettoyage garanti des ressources.
4. Unifier les projections de lecture, normaliser les préférences et réconcilier la pagination ; corriger la limite de contributeurs en parallèle de ces petits changements.
5. Supprimer les éléments d’interface inutilisés et mesurer les besoins d’index et les coûts graphiques.

Chaque étape peut être livrée séparément avec ses tests de comportement. Le résultat recherché est une meilleure profondeur : les appelants demandent un résultat métier, et le module possède les contraintes nécessaires pour le fournir correctement.
