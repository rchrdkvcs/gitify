# Contexte produit

## Vision

Gitify est une plateforme web qui aide les développeurs à découvrir des projets open-source GitHub correspondant à leur niveau et à leurs langages, puis à conserver leurs repositories favoris pour les retrouver facilement.

## Public cible

- Étudiants et développeurs juniors cherchant leurs premières contributions open-source
- Développeurs expérimentés cherchant des projets actifs dans leur stack

## Fonctionnalités

### Accès public

Le catalogue et les pages projet sont publics : aucune connexion n’est requise pour explorer. Pour les visiteurs, les données GitHub sont récupérées avec le token serveur (`GITHUB_SERVER_TOKEN`) ; un utilisateur connecté consomme son propre quota. Sans token serveur, les visiteurs voient uniquement les données déjà en cache.

### Authentification GitHub

Connexion via GitHub OAuth, nécessaire uniquement pour les favoris et les préférences. Aucun mot de passe, aucun JWT stocké côté client. La session est gérée par AdonisJS dans un cookie HTTP-Only — elle n’est jamais exposée à JavaScript.

### Onboarding guidé (`GET /onboarding`)

Après sa première connexion GitHub, l’utilisateur est redirigé vers un parcours en quatre questions, une par écran, suivi d’un écran de fin (« Ton compte est prêt ») :

1. **Niveau** : première contribution, quelques contributions ou contributeur aguerri
2. **Façons de contribuer** : code, documentation, tests, traduction, design, triage (au moins une) ; coder n’est pas obligatoire
3. **Langages** : facultatif, pré-sélectionnés d’après les langages de ses propres dépôts GitHub
4. **Centres d’intérêt** : sujets GitHub facultatifs

Chaque réponse confirmée est enregistrée aussitôt. « Plus tard » interrompt le parcours sans le perdre : la connexion suivante mène au catalogue, qui affiche un bandeau pour reprendre à la première question sans réponse. Les comptes existants (préférences historiques) se voient proposer le parcours à leur prochaine connexion, pré-rempli. Le parcours reste accessible depuis le profil et les préférences pour revoir ses réponses.

### Préférences utilisateur

L’utilisateur connecté peut modifier sur `/preferences` les mêmes réponses que dans l’onboarding :

- **Niveau** : `first_contribution`, `some_contributions` (recherches « good first issue ») ou `experienced` (projets populaires « help wanted »). Les anciennes valeurs `beginner` et `expert` ont été migrées vers `first_contribution` et `experienced`.
- **Façons de contribuer**, **langages** et **sujets** : une liste vide signifie « pas de préférence ».

Elles fixent les filtres par défaut du catalogue : langages, niveau de recherche, tri « Plus accueillants » pour une première contribution, et sujets favoris en tête des raccourcis. Elles sont exposées par `shared/preferences.ts` aux autres fonctionnalités (par exemple un fil d’issues filtré par niveau, langages et étiquettes associées aux façons de contribuer).

### Score d’accueil des débutants

Chaque projet reçoit un score sur 100 qui mesure sa capacité à accueillir une première contribution. Il est calculé à chaque enrichissement des détails du projet (cache de 12 heures) à partir de cinq signaux GitHub :

| Signal                             | Poids | Plein score                                              |
| ---------------------------------- | ----- | -------------------------------------------------------- |
| Délai de première réponse          | 25    | médiane ≤ 24 h, 0 au-delà de 30 jours (échelle log)      |
| PR externes fusionnées             | 20    | ≥ 80 % (au moins 3 PR tranchées)                         |
| Issues « good first issue » libres | 20    | ≥ 5 non assignées                                        |
| Guide du contributeur              | 15    | CONTRIBUTING, modèles d’issue et de PR, code de conduite |
| Activité des mainteneurs           | 20    | dernier commit ou PR fusionnée ≤ 14 jours, 0 après un an |

Les contributions « externes » excluent le propriétaire, les membres, les collaborateurs et les bots. Un signal indisponible n’est pas compté comme nul : le score est recalculé sur les signaux connus et marqué comme estimation (`partial`, `coverage`). En dessous de 50 % du poids connu, aucun score n’est affiché. Un dépôt archivé vaut 0 et disparaît du catalogue.

Le score apparaît sur les cartes du catalogue, dans la colonne latérale de la fiche projet, avec le détail de chaque signal dans l’onglet « Contribuer ». Le catalogue peut être trié par score (`sort=welcome`) et filtré par score minimal (`score=50`).

### Vitrine (`GET /`)

Page d’accueil publique. Affiche une sélection de projets par langage, piochés aléatoirement dans un pool local. Les recherches expirées sont rafraîchies avec le token serveur.

### Catalogue (`GET /explore`)

Catalogue public paginé (24 projets par page, défilement infini). Filtres en query string :

- `q` — recherche dans le nom, le propriétaire, la description et les sujets
- `topic` — sujet GitHub exact ; les sujets les plus fréquents pour les filtres courants sont proposés en raccourci
- `language` — liste séparée par des virgules
- `level` — `all`, `beginner` ou `expert`
- `sort` — `stars` (défaut), `recent` (dernier push), `issues` ou `welcome` (score d’accueil)
- `score` — score d’accueil minimal (1 à 100)

Pour le lecteur connecté, chaque filtre absent de la query string reprend ses préférences : langages, niveau, et tri `welcome` pour une première contribution (`stars` sinon). Un paramètre présent ne remplace que son propre filtre : `?sort=recent` garde les langages préférés. Un paramètre vide le vide explicitement : `language=` affiche tous les langages. Les dépôts archivés sont exclus. La première page rafraîchit les recherches GitHub expirées pour les langages sélectionnés.

### Issues pour moi (`GET /issues`)

Fil public d’issues ouvertes, tous dépôts confondus (24 par page, défilement infini) : l’action concrète de contribution est de choisir une issue. Chaque carte affiche le titre (lien vers l’issue GitHub), le dépôt (lien vers la page projet Gitify), son langage, l’ancienneté, le nombre de commentaires, les étoiles du dépôt, les labels et les signaux « good first issue », « help wanted », non assignée et sans PR liée.

Filtres en query string :

- `q` — recherche dans le titre de l’issue, le nom et le propriétaire du dépôt
- `language` — liste séparée par des virgules
- `label` — `good-first-issue`, `help-wanted` ou `documentation` (toutes par défaut)
- `unassigned` — actif par défaut ; `unassigned=0` affiche aussi les issues déjà assignées
- `sort` — `recent` (défaut, plus récentes), `comments` (moins commentées d’abord) ou `stars` (dépôts les plus étoilés)

Comme pour le catalogue, chaque filtre absent reprend les préférences du lecteur connecté (`language=` vide affiche tous les langages). Le type d’issue par défaut reste unique : si le lecteur a choisi la contribution « Documentation » sans « Code », c’est `documentation` ; sinon le niveau décide, `good-first-issue` pour un débutant ou `help-wanted` pour un contributeur aguerri. Les autres types de contribution n’ont pas encore de label dédié et suivent le niveau. Les mêmes règles d’accès que le catalogue s’appliquent (token serveur pour les visiteurs, quota personnel pour les utilisateurs connectés).

Les issues proviennent de la recherche GraphQL GitHub (`is:issue is:open is:public archived:false -linked:pr language:X label:"…"`), une recherche par couple langage × type. Les issues des dépôts archivés ou privés et celles déjà liées à une pull request ouverte sont écartées. Chaque recherche est mise en cache 6 heures ; un échec GitHub conserve l’instantané précédent. Les dépôts découverts ainsi sont enregistrés comme projets, pour que leur page Gitify soit accessible, sans entrer dans le catalogue `/explore`.

### Favoris

- **Ajouter** (`POST /api/projects/:id/favorite`) — ajoute un projet aux favoris
- **Retirer** (`DELETE /api/projects/:id/favorite`) — retire un projet des favoris
- **Lister** (page `GET /favorites`) — affiche les favoris paginés, du plus récent au plus ancien

Ces actions sont idempotentes et réservées aux utilisateurs connectés. Un visiteur qui clique sur un favori est redirigé vers la connexion GitHub.

### Détail d’un projet (`GET /projects/:owner/:name`)

L’URL reprend celle de GitHub (insensible à la casse). La page regroupe, en onglets :

- **Aperçu** — extraits de chaque onglet (contribuer, activité, top contributeurs, PR récentes) puis le README dans un cadre de hauteur fixe
- **Contribuer** — issues « good first issue », étapes pour démarrer, fichiers communautaires présents, `CONTRIBUTING.md` (y compris celui partagé par l’organisation)
- **Issues** et **Pull requests** — les 20 plus récentes ouvertes
- **Contributeurs** — les 30 principaux et le total
- **Activité** — commits par semaine sur un an, taux d’issues résolues, PR fusionnées, répartition du code

La colonne latérale affiche étoiles, forks, watchers, contributeurs, issues et PR ouvertes, commits, releases, taille, dernier commit, date de création, santé communautaire, stack technique, sujets et liens.

Ces données proviennent de l’API GraphQL GitHub (statistiques, issues, PR, langages, CONTRIBUTING) et de l’API REST (README, contributeurs, profil communautaire, activité). Elles sont enrichies à la demande et mises en cache 12 heures ; un échec GitHub conserve l’instantané précédent.

## Langages supportés

La liste de référence est `languageCatalog` dans `shared/preferences.ts` : JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, Dart, Objective-C, Scala, Elixir, Erlang, Haskell, OCaml, Clojure, Zig, Lua, Shell, Perl, R, Julia, Nix, HTML, CSS, Vue, Svelte.

La vitrine de l’accueil suit un sous-ensemble de 12 langages (`config/gitify.ts`).
