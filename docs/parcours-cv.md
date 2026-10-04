---
title: Contributing to the Parcours page
date_published: 2026-08-14
date_modified: 2026-09-28
---

# Contributing to the Parcours page

Ref: issue #47. How to edit the content of `/a-propos/parcours/`, the résumé page. For the
shortcode, partial and CSS contracts, see
[components.md](components.md#parcours-shortcodes).

## Where the content lives

Everything is in `content/a-propos/parcours.md`:

- the `description` front matter is both the intro paragraph under the `h1` and the meta
  description;
- the body is a sequence of shortcodes, one per section: `timeline` ("Maintenant"),
  `resume-text` ("Avant"), `skills` ("Compétences").

Section titles and periods are shortcode parameters, written in the content like any other
text. `layouts/parcours/single.html` renders only the header and the body.

The page lives under `content/a-propos/` but keeps `type = 'parcours'` in its front matter.
Hugo's template lookup follows `.Type`: without it, the page falls back to
`layouts/_default/single.html` and loses the parcours styles.

## Adding a job or a diploma

Add a `timeline-item` inside `timeline`, at its chronological place. Entries are written
most recent first, and nothing sorts them for you.

```markdown
{{</* timeline-item debut="2024-03" fin="2024-09" titre="Job title" organisation="Employer"
    resume="One sentence, inline Markdown allowed." tags="php, symfony" */>}}
```

- `debut`, `titre` and `organisation` are required. `fin` is omitted for the current
  position.
- Dates follow ISO 8601: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. Only the year is displayed; the
  full value stays in the `<time datetime>` attribute.
- `tags` are lowercase slugs, comma-separated. A tag links to its term page only when some
  content carries that term; otherwise it renders as plain text.

## Adding a skill

The `skills` shortcode lists every tag actually used on the site — nothing to edit there,
it follows content automatically. Tag a project, a blog post or a veille entry, and the
skill appears, linked to its term page.

For a skill nothing published backs yet, add it to `extra`:

```markdown
{{</* skills title="Compétences" extra="Python, Kubernetes" */>}}
```

`extra` renders as plain, unlinked tags. The build fails if an `extra` entry, lowercased,
already matches a tag used in content — that skill has a term page and belongs there
instead, not in `extra`.

## The pivot year

The year separating "Maintenant" from "Avant" (2017) is written by hand in the
`description` and in the `period` of `timeline` and `resume-text`. Change all three together.

## Validating a change

`task qa` builds the site with any Hugo `WARN` treated as a failure. A missing required
parameter or an `extra` entry that duplicates a tag fails the build through `errorf`.
