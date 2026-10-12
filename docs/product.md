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

### Préférences utilisateur

L’utilisateur connecté peut enregistrer :

- **Difficulté** : `beginner` (projets avec "good first issues") ou `expert` (projets populaires avec "help wanted")
- **Langages** : un ou plusieurs parmi les langages supportés

Elles servent de filtres par défaut à sa première visite du catalogue.

### Vitrine (`GET /`)

Page d’accueil publique. Affiche une sélection de projets par langage, piochés aléatoirement dans un pool local. Les recherches expirées sont rafraîchies avec le token serveur.

### Catalogue (`GET /explore`)

Catalogue public paginé (24 projets par page, défilement infini). Filtres en query string :

- `q` — recherche dans le nom, le propriétaire, la description et les sujets
- `topic` — sujet GitHub exact ; les sujets les plus fréquents pour les filtres courants sont proposés en raccourci
- `language` — liste séparée par des virgules
- `level` — `all`, `beginner` ou `expert`
- `sort` — `stars` (défaut), `recent` (dernier push) ou `issues`

Sans paramètre, les préférences du lecteur connecté s’appliquent. La première page rafraîchit les recherches GitHub expirées pour les langages sélectionnés.

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

TypeScript, JavaScript, Python, Rust, Go, C++, PHP, Java, Kotlin, Swift, Dart, Ruby
