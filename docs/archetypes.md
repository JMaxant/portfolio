---
title: Hugo archetypes
date_published: 2026-08-01
date_modified: 2026-10-04
---

# Hugo archetypes

Ref: issue #4, phase 0 of the [cahier des charges](cahier-des-charges.md) (section 5quater).

## Principle

An archetype is a front matter template applied by `hugo new <path>`. Hugo picks the archetype from the **first segment of the path** (`hugo new blog/...` → `archetypes/blog.md`) and falls back to `archetypes/default.md` otherwise.

## Site archetypes

| Archetype    | Use             | Specific fields                                         |
|--------------|-----------------|---------------------------------------------------------|
| `default.md` | Generic pages   | —                                                       |
| `blog.md`    | Blog posts      | `tags`, `description`, `images`                         |
| `projets.md` | Project pages   | `tags`, `description`, `status`, `repo`, `demo`, `role` |
| `veille.md`  | Veille entries  | `tags`, `description`, `link`, `source_lang`            |

Common fields: `title` (derived from the file name), `date`, `draft = true`, `translationKey`.

## Creating content

```sh
hugo new blog/my-post/index.md      # post (page bundle)
hugo new projets/my-project/index.md    # project page (page bundle)
hugo new veille/my-link.md             # veille entry (single file)
```

The *page bundle* form (`<slug>/index.md`) is the site convention: one folder per piece of content, which will hold its images. `title` and `translationKey` are then derived from the folder name. Exception: veille entries, which are teaser-only and have no resources, stay single files.

Traps:

- `hugo new blog` fails ("failed to resolve"): the command expects the path of a content file, not a section name.
- Section stubs (`_index.md`) are created by hand, not through `hugo new`: the archetype would apply a useless `draft = true` and date.

## Field conventions

- **`description`** rather than `summary`: `layouts/partials/seo_tags.html` reads `.Description` for the meta description and OpenGraph, falling back to `.Summary`, then `site.Params.description`; `summary` is already a field Hugo computes from the content.
- **`translationKey`**: pairs future translations (phase 2, section 7 of the cahier des charges) regardless of slugs. Derived from the content name, ignored while the site is monolingual.
- **`tags`**: the site's single taxonomy, which includes the tech stack (decision in section 5quinquies, no separate `stack` taxonomy). Veille nuance: the field does feed the `/tags/*` pages since the switch to `build.render = 'link'` (verified empirically; `render = 'never'` excluded them whatever `list` was).
- **`status`** (projets): `en cours` or `terminé` (values are French, as rendered).
- **`images`** (blog): list of image paths for the social preview, read by Hugo's embedded OpenGraph template as `og:image` (absolute URL). Optional: without it, the preview has no image. Replaces the `cover` front matter field, which no template read (#14). See [seo.md](seo.md).
- **`source_link`** (veille): URL of the shared article. Veille entries are *teaser-only* (issue #40): a cascade in `content/veille/_index.md` gives them `build.render = 'link'` and `build.list = 'local'`, so no page of their own is generated. Anything that links an entry — a list layout, a feed — must use `source_link`, never `.Permalink`: `render = 'link'` does assign one, but it has no rendering and returns a 404. `entry-link.html` and `layouts/_default/rss.xml` both handle it (#74).
- **`source_lang`** (veille): language of the source, BCP 47 code (`fr`, `en`…). Intended for the `lang` attribute (a11y) and future filtering.

## TOML quotes vs Go template

Two nested languages, two rules:

```toml
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
```

Outer (TOML): single quotes. Inner (Go template, evaluated by `hugo new`): double quotes are mandatory — `'-'` there would be a character literal, not a string.
