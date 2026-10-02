---
title: SEO — contributor guidelines
version: 1.2.0
date_published: 2026-10-02
date_modified: 2026-10-02
---

# SEO — contributor guidelines

Ref: issues #14 and #15. What a content author or template author must do so that every page carries
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
| `<script type="application/ld+json">` | `layouts/partials/json-ld.html`, see [Structured data](#structured-data) |

`<meta name="title">` and `<meta name="keywords">` are not emitted on purpose: the first is not
a standard tag, search engines ignore the second. Do not add them back.

## Writing a description

The description is resolved from the first non-empty value of:

1. `description` in the front matter. `description = ''` counts as empty.
2. On a tag page only, the `tag-description` string of `i18n/fr.toml`, filled with the tag
   name.
3. `.Summary`, which Hugo computes from the body: the first 70 words, or the text above a
   `<!--more-->` marker.
4. `params.description` in `config/_default/hugo.toml`.

`og:description` and `twitter:description` use the same chain, except step 2: Hugo's embedded
OpenGraph template reads `.Description` only, so a tag page shares the site description in
its social preview. Tag pages are rarely shared; overriding the embedded template to close the
gap would mean maintaining a copy of it.

Rules:

- **Fill `description` on every content page.** The summary fallback starts with whatever the
  body starts with — a heading, an emoji, a code sample — which rarely reads as a description.
- **One or two sentences, around 150 characters.** Search engines truncate longer text, and
  LinkedIn cuts the preview shorter still.
- **Unique per page.** A search engine usually replaces a duplicated description with an
  excerpt of its own choosing.
- **Plain text.** Markup is stripped, so Markdown or HTML in the field only adds noise.

### Section and tag pages

A section list takes its description from its `_index.md`: give one to every new section.
`params.description` is a safety net, not a target — no page reaches it today.

A tag page has no content file, so it gets the generated `tag-description`. To write a
specific one for a tag, create `content/tags/<term>/_index.md` with a `description`: step 1
wins over step 2, and the social preview follows.

## Page title

`baseof.html` builds `<title>` as `<page title> | <site title>`. The home page is the
exception, since its title is the site title: it reads `<site title> | <baseline>` instead.

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

## Structured data

Every page but the 404 carries one schema.org `@graph` in JSON-LD. Microdata is not used: the
breadcrumb is described in the same graph rather than with `itemprop` attributes on its HTML.

| Page | Nodes |
|------|-------|
| Home | `WebSite`, `Person` |
| `/a-propos/` | `ProfilePage` whose `mainEntity` is the `Person`, `BreadcrumbList` |
| Blog article | `BlogPosting`, `Person`, `BreadcrumbList` |
| Project | `Article`, `Person`, `BreadcrumbList` |
| Any other page | `BreadcrumbList` |

The `Person` is built from the site configuration: `params.author` gives `name`, `jobTitle` and
`knowsAbout`, and every `url` of `params.social` becomes a `sameAs`. Those profile links are
what lets a search engine tie the site to the same person elsewhere, so keep them current.

An article's `description` and `image` resolve as the meta tags do: the description chain
above, and the `og:image` lookup. `keywords` lists its `tags`, `datePublished` is its `date`.
`dateModified` is left out until `.Lastmod` has a reliable source (#70).

A project is always an `Article`, since a case study need not be about code. Its `about` holds
a `SoftwareSourceCode` only when `repo` is filled: leave `repo` empty for a project with no
public source.

The `Person` is emitted in full on every page that references it. An `@id` reference resolves
within one document only, so a page pointing at a `Person` defined elsewhere has an author
without a name.

Check a new template or content type with [validator.schema.org](https://validator.schema.org/)
and Google's [Rich Results Test](https://search.google.com/test/rich-results).

## What the tests check

`tests/seo.spec.js` loads one page per template and asserts that:

- the canonical URL and `og:url` match the page URL;
- the meta description is not empty and equals `og:description`, tag pages excepted;
- `og:title`, `og:type`, `og:locale` and `author` are present;
- `og:image`, when present, is an absolute URL;
- the home page title does not repeat the site name.

`tests/json-ld.spec.js` checks the node types of each template, that every `@id` reference
points to the `Person` of the same page, that a project has an `about` only with a `repo`, and
that the `BreadcrumbList` matches the visible trail.

A new list template (see the `_default/list.html` gotcha in `CLAUDE.md`) gets a line in the
spec's `PAGES` table.

The tests cannot judge a description's quality: a page falling back to the site description
passes. Check the built `<head>` when adding content.
