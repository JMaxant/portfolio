---
title: SEO — contributor guidelines
version: 1.0.0
date_published: 2026-10-02
date_modified: 2026-10-02
---

# SEO — contributor guidelines

Ref: issue #14. What a content author or template author must do so that every page carries
a usable description and social preview. The partial contract itself is documented in
[components.md](components.md#seo_tagshtml).

## What every page emits

`layouts/partials/seo_tags.html`, called once from `baseof.html`, emits:

| Tag | Source |
|-----|--------|
| `<link rel="canonical">` | `.Permalink` |
| `<meta name="description">` | The description chain below |
| `<meta name="author">` | `params.author.name` in `config/_default/hugo.toml` |
| `og:*`, `twitter:*` | Hugo's embedded `opengraph.html` and `twitter_cards.html` |
| `itemprop` microdata | Hugo's embedded `schema.html`, until the JSON-LD of #15 |

`<meta name="title">` and `<meta name="keywords">` are not emitted on purpose: the first is not
a standard tag, search engines ignore the second. Do not add them back.

## Writing a description

The description is resolved from the first non-empty value of:

1. `description` in the front matter. `description = ''` counts as empty.
2. `.Summary`, which Hugo computes from the body: the first 70 words, or the text above a
   `<!--more-->` marker.
3. `params.description` in `config/_default/hugo.toml`.

`og:description` and `twitter:description` use the same chain, so one field feeds all three.

Rules:

- **Fill `description` on every content page.** The summary fallback starts with whatever the
  body starts with — a heading, an emoji, a code sample — which rarely reads as a description.
- **One or two sentences, around 150 characters.** Search engines truncate longer text, and
  LinkedIn cuts the preview shorter still.
- **Unique per page.** A search engine usually replaces a duplicated description with an
  excerpt of its own choosing.
- **Plain text.** Markup is stripped, so Markdown or HTML in the field only adds noise.

### Pages that fall back to the site description

A page with neither a description nor a body ends up at step 3 and shares the site-wide
text. Today that is:

- the section lists `/blog/`, `/projets/` and `/veille/`, whose `_index.md` has
  `description = ''` and no body;
- every tag page `/tags/<term>/`, which Hugo generates from the taxonomy with no content file.

`params.description` is a safety net, not a target: when adding a section, give its
`_index.md` a description.

## Social preview image

`og:image` is optional. Hugo's embedded template looks, in order, for:

1. `images` in the front matter — a list of paths, the first one is used;
2. a resource of the page bundle named `*feature*`, `*cover*` or `*thumbnail*`;
3. `params.images` in the site configuration.

With none of these, no `og:image` is emitted, the Twitter card falls back from
`summary_large_image` to `summary`, and LinkedIn shows a text-only preview. Use a
1200×630 image for a full-width preview. The `images` field replaced `cover`, which no
template ever read.

## Locale

`og:locale` is derived from `locale` in `config/_default/hugo.toml`, which must keep its region
in upper case: `fr-FR` yields `fr_FR`, `fr-fr` yields `fr_fr`, which scrapers do not recognise.

## What the tests check

`tests/seo.spec.js` loads one page per template and asserts that:

- the canonical URL and `og:url` match the page URL;
- the meta description is not empty and equals `og:description`;
- `og:title`, `og:type`, `og:locale` and `author` are present;
- `og:image`, when present, is an absolute URL.

A new list template (see the `_default/list.html` gotcha in `CLAUDE.md`) gets a line in the
spec's `PAGES` table.

The tests cannot judge a description's quality: a page falling back to the site description
passes. Check the built `<head>` when adding content.
