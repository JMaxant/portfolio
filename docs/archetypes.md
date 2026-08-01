---
title: Archetypes Hugo
version: 1.0.0
date_published: 2026-08-01
date_modified: 2026-08-01
---

# Archetypes Hugo

Réf : issue #4, Phase 0 du [cahier des charges](cahier-des-charges.md) (section 5quater).

## Principe

Un archetype est un template de front matter appliqué par `hugo new <chemin>`. Hugo choisit l'archetype d'après le **premier segment du chemin** (`hugo new blog/...` → `archetypes/blog.md`) et retombe sur `archetypes/default.md` sinon.

## Archetypes du site

| Archetype    | Usage            | Champs spécifiques                                      |
|--------------|------------------|---------------------------------------------------------|
| `default.md` | Pages génériques | —                                                       |
| `blog.md`    | Articles de blog | `tags`, `description`, `cover`                          |
| `projets.md` | Fiches projets   | `tags`, `description`, `status`, `repo`, `demo`, `role` |

Champs communs : `title` (dérivé du nom de fichier), `date`, `draft = true`, `translationKey`.

## Créer un contenu

```sh
hugo new blog/mon-article/index.md      # article (page bundle)
hugo new projets/mon-projet/index.md    # fiche projet (page bundle)
```

La forme *page bundle* (`<slug>/index.md`) est la convention du site : un dossier par contenu, qui accueillera ses images. `title` et `translationKey` sont alors dérivés du nom du dossier.

Pièges :

- `hugo new blog` échoue (« failed to resolve ») : la commande attend le chemin d'un fichier de contenu, pas un nom de section.
- Les stubs de section (`_index.md`) se créent à la main, pas via `hugo new` : l'archetype y appliquerait `draft = true` et une date inutiles.

## Conventions de champs

- **`description`** plutôt que `summary` : le thème bear-cub lit `.Params.description` pour le SEO et les cartes sociales ; `summary` est déjà un champ calculé par Hugo depuis le contenu.
- **`translationKey`** : apparie les futures traductions (Phase 2, section 7 du cahier des charges) indépendamment des slugs. Dérivé du nom du contenu, ignoré tant que le site est monolingue.
- **`tags`** : taxonomie unique du site — inclut la stack technique (décision section 5quinquies, pas de taxonomie `stack` séparée).
- **`status`** (projets) : `en cours` ou `terminé`.
- **`cover`** (blog) : réservé pour un futur layout ; non exploité par bear-cub à ce jour.

## Quotes TOML vs template Go

Deux langages imbriqués, deux règles :

```toml/run
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
```

Extérieur (TOML) : quotes simples. Intérieur (template Go, évalué par `hugo new`) : quotes doubles obligatoires — `'-'` y serait un littéral de caractère, pas une chaîne.
