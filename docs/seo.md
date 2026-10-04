---
title: SEO — contributor guidelines
date_published: 2026-10-02
date_modified: 2026-10-03
---

# SEO — contributor guidelines

Ref: issues #14 to #18, #153. What a content author or template author must do so that every page carries
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

## Feeds

`layouts/_default/rss.xml` renders every feed. Which pages get one:

| Feed | Items |
|------|-------|
| `/index.xml` | Regular pages of `params.mainSections`: the blog and the projects |
| `/<section>/index.xml` | The section's regular pages |
| `/tags/<term>/index.xml` | Every page carrying the tag, veille entries included |

`params.mainSections` also feeds the latest activity of the home page and the sections of
`llms.txt`, so a section added to it appears in all three. Its order is the order of `llms.txt`. `/a-propos/` and the tag index have no feed: the first holds the resume,
which is not a publication, the second lists terms rather than content. A new section that
should not have one sets `outputs = ['html']` in its `_index.md`.

Each feed keeps its 20 most recent items (`services.rss.limit`). Items carry the full content,
not an excerpt: a subscriber reads in their reader, and the item's link leads to the page.

A feed's title and description follow the page's: `<title> | <site title>`, then the
description chain above. An item's description is its `description`, else its summary.

A veille entry links to its `source_link`, since it has no page of its own. Its `guid` stays the
site's Permalink, marked `isPermaLink="false"`: a stable identifier rather than a link.

Every page's `<head>` advertises the main feed, and the page's own feed when it has one.

## Sitemap

`sitemap.xml` is Hugo's built-in one, unmodified. It lists every rendered page, so drafts and
veille entries are left out, and takes `lastmod` from `date` until #70 gives `.Lastmod` a
source. Search engines learn its address from the `Sitemap:` line of `robots.txt` (#17).

## robots.txt

Rendered from `layouts/robots.txt` (`enableRobotsTXT`), not copied from `static/`, so the
`Sitemap:` line follows `baseURL`.

In production, every crawler is allowed, and the known AI crawlers are named in a group of
their own. That group changes nothing today — `*` already allows everything — and states the
intent: the site aims at visibility. The catch is that a crawler named in a group ignores the
`*` group, so a `Disallow` added to `*` must be repeated in the AI group.

Outside production — `hugo server`, or a preview built with another `--environment` — the file
disallows everything, so a preview is never indexed in place of the real site.

### Changing robots.txt

- **Allow a new AI crawler**: add its user-agent token to the `slice` in `layouts/robots.txt`.
  Take the token from the vendor's documentation, not from a list found elsewhere: tokens are
  renamed and split over time (OpenAI has three, Anthropic three).
- **Block one crawler**: remove it from the AI group and give it a group of its own with
  `Disallow: /`. Leaving it in both does not work: RFC 9309 merges the groups naming the same
  crawler, and between `Allow: /` and `Disallow: /`, equally long, the less restrictive wins.
- **Hide a path from every crawler**: add the `Disallow:` line to the `*` group **and** to the AI
  group, for the reason above. `robots.txt` is a request, not access control: anything that must
  stay private does not belong in `public/`.

### Checking it locally

`task run` serves the development version, which disallows everything. To read the production
file, build with `hugo` and open `public/robots.txt`. Through `task run`, open
`http://localhost:1313/robots.txt` rather than the file on disk: `hugo server` renders in memory
and leaves `public/` as the last build wrote it. A browser may also serve a cached copy after a
change; reload without the cache.

## Markdown versions

Each blog article and project is also published as `index.md` next to its HTML page
(`/blog/<slug>/index.md`), for agents that would otherwise read mostly boilerplate. It holds the
title, the description as a quote and the body, with no front matter.

- **Output format**: `markdown` in `config/_default/hugo.toml` (`text/markdown`, base name
  `index`), rendered from `layouts/_default/single.md`.
- **Scope**: enabled by `cascade.outputs` in `content/blog/_index.md` and
  `content/projets/_index.md`, for the `page` kind only. Listings, tag pages, `/a-propos/` and
  the home page get none. A new publication section copies that cascade.
- **Shortcodes** are stripped from the raw body: they render HTML for the page and have no
  Markdown equivalent. Keep the text a reader needs outside a shortcode.
- **Links**: `](/path)`, `](#id)` and `](path)` are made absolute against the site and the page.
  Only the Markdown syntax is rewritten: a raw `<a href>` or `<img src>` in the body is kept as
  written.
- **Advertised** by `<link rel="alternate" type="text/markdown">` in the head, and by a visible
  link (`markdown-link.html`) at the end of the article.
- **`llms.txt` links to the Markdown version instead of the HTML page**: it is the cleaner
  target, and the HTML page stays one link away through the canonical URL.

**HTTP headers.** A `.md` file cannot carry a `<link rel="canonical">`, and nothing stops a
search engine from indexing it next to the HTML page: it is not in `sitemap.xml`, but the
`rel="alternate"` link and `llms.txt` expose it. Each one is therefore served with an HTTP
header, `Link: <html-url>; rel="canonical"`. The host also leaves the charset out of
`text/markdown` and `text/plain`, so a browser guesses one and shows `Ã©` for `é` (#168): the
same rules set `Content-Type` with `charset=utf-8`.

- **Generated**: the `headers` output format of the home page (`config/_default/hugo.toml`)
  renders `/_headers` from `layouts/index.headers`, the file Cloudflare parses and does not
  serve. It is never edited by hand.
- **One rule per section, not per page**: the `:slug` placeholder of the path is reused in the
  value (`Link: <https://…/blog/:slug/>`). A section is listed once it has a page with a
  Markdown version, so a new section copying the cascade needs no change here.
- **Limits**: 100 rules and 2,000 characters per line. The file holds a handful of rules, and
  its size does not grow with the content.
- **Tested**: `tests/headers.spec.js` checks the generated file, and
  `tests/live/smoke.spec.js` checks the headers a deployed article and the text files really
  carry. The live test is the only one that proves the host applies them.
- Do not use `X-Robots-Tag: noindex` instead: some AI crawlers read it as "do not use", which
  defeats the point of publishing Markdown.

Content negotiation on `Accept: text/markdown` is out of scope: no candidate host supports it
(#20). So is a directive hidden in the HTML, which would be cloaking (see
[ADR 0004](adr/0004-no-afdocs.md)).

## llms.txt

`/llms.txt` follows the [llmstxt.org](https://llmstxt.org/) proposal: a summary of the site,
written for a language model, with links to the pages worth reading. It is an output format of
the home page (`llms` in `config/_default/hugo.toml`), rendered from `layouts/index.llms.txt`,
so it follows the content without being rewritten.

| Part | Source |
|------|--------|
| `# title` | `title` in the site configuration |
| `> summary` | `params.description` |
| Introduction | `llms_intro` in `content/_index.md` |
| One `##` per section | The regular pages of each `params.mainSections` entry, then `/a-propos/` and its pages |
| `## Optional` | `/veille/`, as one link: its entries point to other sites |

Each link reads `[title](url): description`, the url being the [Markdown version](#markdown-versions)
of the page when it has one, the HTML page otherwise, the description falling back to the summary, as
in the feeds. A page's `description` is therefore what an agent reads about it: the rules of
[Writing a description](#writing-a-description) apply here too.

`## Optional` is defined by the proposal: an agent short on context may skip it.

### Changing llms.txt

Most changes need no template edit:

- **The introduction**: edit `llms_intro` in `content/_index.md`. Keep it factual and in the
  third person, since an agent quotes it as is, and update it when the positioning changes — it
  is the one hand-written part, so the only one that can go stale.
- **A new page** in a listed section appears on the next build; a draft does not.
- **A new publication section**: add it to `params.mainSections`. It then also enters the main
  feed and the home page's latest activity; if it should not, list it in the template instead,
  as `/a-propos/` is.
- **The section order**: the order of `params.mainSections`, then À propos, then Optional.
- **Leaving a page out**: there is no switch for `llms.txt` alone. `build.list = 'never'` in
  the page's front matter keeps the page online but removes it from every list — `llms.txt`,
  feeds, sitemap, section pages. Write `[build]` last in the front matter: TOML assigns every
  key below a table header to that table.

### Checking it locally

`task run` builds drafts (`-D`), so `http://localhost:1313/llms.txt` lists them. To see what
will be deployed, build with `hugo` and open `public/llms.txt`.

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

`tests/feeds.spec.js` checks what the main feed lists, that the `/a-propos/` and tag index
feeds are not generated, that a veille entry links to its source, and that every page
advertises the main feed.

`tests/robots-llms.spec.js` checks that `robots.txt` names the AI crawlers, disallows nothing in
production and points to a sitemap that resolves, and that `llms.txt` is plain text with the
expected headings, lists the publications but not the veille entries, and has no broken link.

`tests/markdown.spec.js` checks that an article and a project have an `index.md` with title,
description and body but no front matter, that shortcodes are gone and links absolute, that the
HTML page advertises and links to it, that the excluded page kinds have none, and that
`llms.txt` points to it.

A new list template (see the `_default/list.html` gotcha in `CLAUDE.md`) gets a line in the
spec's `PAGES` table.

The tests cannot judge a description's quality: a page falling back to the site description
passes. Check the built `<head>` when adding content.
