---
title: Archetypes Hugo
version: 1.2.0
date_published: 2026-08-01
date_modified: 2026-08-08
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
| `veille.md`  | Entrées de veille | `tags`, `description`, `link`, `source_lang`           |

Champs communs : `title` (dérivé du nom de fichier), `date`, `draft = true`, `translationKey`.

## Créer un contenu

```sh
hugo new blog/mon-article/index.md      # article (page bundle)
hugo new projets/mon-projet/index.md    # fiche projet (page bundle)
hugo new veille/mon-lien.md             # entrée de veille (fichier simple)
```

La forme *page bundle* (`<slug>/index.md`) est la convention du site : un dossier par contenu, qui accueillera ses images. `title` et `translationKey` sont alors dérivés du nom du dossier. Exception : les entrées de veille, teaser-only et sans ressources, restent des fichiers simples.

Pièges :

- `hugo new blog` échoue (« failed to resolve ») : la commande attend le chemin d'un fichier de contenu, pas un nom de section.
- Les stubs de section (`_index.md`) se créent à la main, pas via `hugo new` : l'archetype y appliquerait `draft = true` et une date inutiles.

## Conventions de champs

- **`description`** plutôt que `summary` : le thème bear-cub lit `.Params.description` pour le SEO et les cartes sociales ; `summary` est déjà un champ calculé par Hugo depuis le contenu.
- **`translationKey`** : apparie les futures traductions (Phase 2, section 7 du cahier des charges) indépendamment des slugs. Dérivé du nom du contenu, ignoré tant que le site est monolingue.
- **`tags`** : taxonomie unique du site — inclut la stack technique (décision section 5quinquies, pas de taxonomie `stack` séparée). Nuance veille : le champ alimente bien les pages `/tags/*` depuis le passage à `build.render = 'link'` (vérifié empiriquement ; `render = 'never'` les en excluait, quel que soit `list`).
- **`status`** (projets) : `en cours` ou `terminé`.
- **`cover`** (blog) : réservé pour un futur layout ; non exploité par bear-cub à ce jour.
- **`link`** (veille) : URL de l'article partagé. Les entrées de veille sont *teaser-only* (issue #40) : un cascade dans `content/veille/_index.md` leur applique `build.render = 'link'` et `build.list = 'local'` — aucune page individuelle n'est générée. Un layout de liste doit donc lier `link`, jamais `.RelPermalink` : `render = 'link'` l'assigne bel et bien, mais l'URL correspondante n'a pas de rendu et renvoie un 404. Le piège s'applique aussi aux flux, cf. issue #74.
- **`source_lang`** (veille) : langue de la source, code BCP 47 (`fr`, `en`…). Prévu pour l'attribut `lang` (a11y) et un futur filtrage.

## Quotes TOML vs template Go

Deux langages imbriqués, deux règles :

```toml
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
```

Extérieur (TOML) : quotes simples. Intérieur (template Go, évalué par `hugo new`) : quotes doubles obligatoires — `'-'` y serait un littéral de caractère, pas une chaîne.
