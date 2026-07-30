# Contexte produit

## Vision

Gitify est une plateforme web qui aide les développeurs à découvrir des projets open-source GitHub correspondant à leur niveau et à leurs langages, puis à conserver leurs repositories favoris pour les retrouver facilement.

## Public cible

- Étudiants et développeurs juniors cherchant leurs premières contributions open-source
- Développeurs expérimentés cherchant des projets actifs dans leur stack

## Fonctionnalités

### Authentification GitHub

Connexion exclusivement via GitHub OAuth. Aucun mot de passe, aucun JWT stocké côté client. La session est gérée par AdonisJS dans un cookie HTTP-Only — elle n'est jamais exposée à JavaScript.

### Préférences utilisateur

Avant d'accéder au fil, l'utilisateur configure :

- **Difficulté** : `beginner` (projets avec "good first issues") ou `expert` (projets populaires avec "help wanted")
- **Langages** : un ou plusieurs parmi les 11 langages supportés

Les préférences sont sauvegardées en base (`users.preferences`) et peuvent être modifiées à tout moment.

### Vitrine (`GET /projects/showcase`)

Page d'accueil publique (aucune authentification requise). Affiche une sélection de 6 projets par langage parmi 12 langages configurés. Les projets sont piochés aléatoirement dans un pool local pour varier les affichages. Si le pool est insuffisant, un fetch GitHub est déclenché en arrière-plan avec le token serveur.

### Fil personnalisé (`GET /projects/feed`)

Retourne jusqu'à 60 projets correspondant aux préférences de l'utilisateur. Les projets sont distribués en round-robin entre les langages sélectionnés pour éviter qu'un seul langage monopolise le fil. Si moins de 25 projets sont disponibles, un fetch GitHub est déclenché automatiquement avant la réponse. Chaque projet expose son état `isFavorite`.

### Favoris

- **Ajouter** (`POST /projects/:id/favorite`) — ajoute un projet aux favoris
- **Retirer** (`DELETE /projects/:id/favorite`) — retire un projet des favoris
- **Lister** (`GET /projects/favorites`) — retourne les favoris paginés, du plus récent au plus ancien

Ces actions sont idempotentes et s'appuient sur la table `user_project_favorites`. Ajouter un favori ne retire pas le projet du fil d'exploration.

### Détail d'un projet (`GET /projects/:id`)

Retourne les informations complètes du projet : README, répartition des langages, contributeurs. Ces données sont enrichies depuis GitHub à la demande et mises en cache 7 jours.

## Langages supportés

TypeScript, JavaScript, Python, Rust, Go, C++, PHP, Java, Kotlin, Swift, Dart, Ruby
