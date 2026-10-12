# Mesure de l’index de sélection des projets

Mesure avec `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` sur le PostgreSQL jetable
des tests, dans des tables temporaires supprimées à la fermeture de la connexion.
Aucune donnée applicative n’a été modifiée.

## Correction après intégration des appartenances

La première mesure utilisait un filtre direct sur `projects.language`. Elle
justifiait `(language, stars DESC)` pour cette ancienne requête, mais ce filtre
a disparu lors de la correction des appartenances aux recherches. La mesure a
donc été refaite avec la requête actuelle de `projectsForSearch` :

```sql
SELECT p.* FROM projects p
WHERE EXISTS (
  SELECT m.id FROM project_search_memberships m
  WHERE m.project_id = p.id
    AND m.language IN ('typescript')
    AND m.difficulty = 'beginner'
)
ORDER BY stars DESC LIMIT 60;
```

Jeu synthétique : 100 000 dépôts, 12 langages principaux répartis uniformément,
étoiles déterministes de 0 à 99 999, README en cache. Chaque dépôt appartient
à une recherche dont le langage diffère de son langage principal, avec 40 %
des appartenances débutantes. Des appartenances Rust expertes supplémentaires
sont ajoutées à chaque septième dépôt, sans doublons. Les tables possèdent les
mêmes index d’identité et d’appartenance que l’application, puis sont analysées.
Chaque scénario est exécuté une fois avant la mesure enregistrée.

| Requête actuelle                   | Sans index de projet | Avec `(language, stars DESC)` | Avec `(stars DESC)` |
| ---------------------------------- | -------------------: | ----------------------------: | ------------------: |
| Vitrine TypeScript, limite 30      |            39,838 ms |                     36,528 ms |            5,137 ms |
| Fil TypeScript débutant, limite 60 |            33,457 ms |                     31,315 ms |           26,257 ms |
| Fil Rust expert, limite 60         |            45,354 ms |                     45,787 ms |            1,130 ms |

Le premier index n’est utilisé dans aucun de ces plans : parcours séquentiel
des 100 000 projets, jointure par hachage avec les appartenances, puis tri.
Avec l’index sur les étoiles, PostgreSQL parcourt les dépôts par étoiles et
vérifie les appartenances par leur index `project_id`, sans tri. Il examine
373 projets pour la vitrine, 1 845 pour le fil débutant et 318 pour Rust.

Blocs locaux touchés, lectures et hits additionnés : vitrine 3 094 → 1 919 ;
fil débutant 3 035 → 9 476 ; Rust 3 377 → 1 636. Le fil débutant révèle le
coût des vérifications dispersées : le gain de temps y est modeste et les accès
aux blocs augmentent. Une recherche rare peut encore préférer une jointure suivie
d’un tri ; le plan dépend des statistiques et de la distribution des étoiles.

L’index inutilisé n’est donc pas créé : la migration ajoute seulement `(stars DESC)`,
sans modifier la sémantique des recherches. Les temps sont des mesures
locales sur un jeu synthétique, pas une garantie en production. Les plans devront
être suivis sur les distributions réelles et pour les recherches peu représentées.
