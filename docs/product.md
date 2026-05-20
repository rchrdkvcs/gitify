# Contexte produit

## Vision

Gitify est une plateforme web qui aide les développeurs à découvrir des projets open-source GitHub correspondant à leur niveau et à leurs langages. L'interface reprend le principe du swipe (comme Tinder) : un projet à la fois, liker pour sauvegarder, passer pour ignorer.

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

Retourne jusqu'à 60 projets non encore vus, correspondant aux préférences de l'utilisateur. Les projets sont distribués en round-robin entre les langages sélectionnés pour éviter qu'un seul langage monopolise le fil. Si moins de 25 projets sont disponibles, un fetch GitHub est déclenché automatiquement avant la réponse.

### Swipe

- **Like** (`POST /projects/:id/like`) — sauvegarde le projet dans les favoris
- **Pass** (`POST /projects/:id/pass`) — marque le projet comme ignoré

Les deux actions créent ou mettent à jour une `user_project_interaction`. Un projet passé peut être re-liké (et inversement).

### Projets aimés (`GET /projects/liked`)

Liste paginée (20 par page) des projets likés, triés par date d'interaction décroissante.

### Détail d'un projet (`GET /projects/:id`)

Retourne les informations complètes du projet : README, répartition des langages, contributeurs. Ces données sont enrichies depuis GitHub à la demande et mises en cache 7 jours.

## Langages supportés

TypeScript, JavaScript, Python, Rust, Go, C++, PHP, Java, Kotlin, Swift, Dart, Ruby
