---
title: Contributing to the Parcours page
version: 3.0.0
date_published: 2026-08-14
date_modified: 2026-09-25
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

- **Daily stack**: add it to the `items` list of `skills-daily`.
- **In-progress skill**: add a `proof` inside `skills-direction`, with the skill name and
  the path of the page that demonstrates it. A path that resolves to no page fails the
  build.

```markdown
{{</* proof skill="Go" page="/projets/potager-go/" */>}}
```

Only show an in-progress skill that something published on the site backs. Do not add a
placeholder proof to make a skill appear.

## The pivot year

The year separating "Maintenant" from "Avant" (2017) is written by hand in the
`description` and in the `period` of `timeline` and `resume-text`. Change all three together.

## Validating a change

`task qa` builds the site with any Hugo `WARN` treated as a failure. A missing required
parameter or an unresolved proof fails the build through `errorf`.
