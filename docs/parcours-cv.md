---
title: Contributing to the Parcours page
version: 1.0.0
date_published: 2026-08-14
date_modified: 2026-08-14
---

# Contributing to the Parcours page

Ref: issue #47. How to edit the content of `/parcours/` — the résumé/CV page. For the
template and CSS contract (partials, classes, integration points), see
[components.md](components.md#timeline-itemhtml) instead; this document is about the data,
not the markup.

## Where the content lives

Two files, two different jobs — never move content between them:

| File | Holds | Rendered as |
|------|-------|-------------|
| `assets/cv.json` | Positions, education, skills — what a CV holds | The timeline and the skills sections, and republished verbatim at `/cv.json` |
| `content/parcours/index.md` | The `description` front matter (meta description) and the free-text paragraph about the years before the reconversion | The `<h1>`/intro and the "Avant" section body |

`assets/cv.json` is written in [JSON Resume](https://jsonresume.org/schema/) format, with a
few site-specific extensions prefixed `x_` (`x_tags`, `x_preuve`) that upstream does not
define. Adding a section to the page means adding data to `cv.json`, not editing
`layouts/parcours/single.html` — the template only ever reads what's already there.

## Editing `cv.json`

Every field the template reads is validated against
`scripts/quality/schemas/cv.schema.json`, enforced both by lefthook (`cv-schema` hook, on
`assets/cv.json` changes) and in CI. A field the template doesn't consume is rejected by the
schema (`additionalProperties: false`) rather than silently ignored — so a typo fails at
commit time instead of producing an empty section. Run `task qa` after editing to catch
mistakes before they reach a PR.

### Adding a job or a diploma

Append an object to `work[]` (job) or `education[]` (diploma):

```json
{
  "name": "Employer name",
  "position": "Job title",
  "startDate": "2024-03",
  "endDate": "2024-09",
  "summary": "One sentence, inline Markdown allowed.",
  "x_tags": ["php", "symfony"]
}
```

- `startDate` (required) and `endDate` (optional — omit for the current position) follow
  ISO 8601: `"YYYY"`, `"YYYY-MM"` or `"YYYY-MM-DD"`. Only the year is ever displayed; the
  full value stays in the `<time datetime>` attribute.
- `education[]` uses `institution`/`studyType` instead of `name`/`position`, same
  `startDate`/`endDate`/`summary`/`x_tags`.
- `x_tags` are lowercase slugs (`^[a-z0-9]+(-[a-z0-9]+)*$`). A tag renders as a link only if
  a page in the site actually carries that taxonomy term — otherwise it's plain text. This
  cannot break the build: a tag with no matching content just doesn't link anywhere yet.
- Both arrays render into one antichronological timeline (`work` and `education` merged and
  sorted by `startDate`, most recent first) — there's no need to interleave them by hand.

### Adding a skill

Append an object to `skills[]`:

```json
{ "name": "Go", "level": "En cours d'acquisition", "x_preuve": "/blog/apprendre-go-venant-de-php/" }
```

- `level` is a closed enum, exactly one of the two strings below — anything else fails the
  build (`errorf` in the template) and the commit (schema `enum`):
  - `"Pratiqué au quotidien"` — daily stack, listed as plain tags.
  - `"En cours d'acquisition"` — in-progress skills, each backed by a proof (see below).
- `x_preuve` (optional, only meaningful for `"En cours d'acquisition"`): the root-relative
  permalink of a page on this site that demonstrates the skill (a blog post, a project). If
  present, it **must** resolve to a real page — a broken path fails the build, on purpose,
  rather than dropping the skill silently.
- **An in-progress skill with no `x_preuve` is left off the page entirely** — it still lives
  in `cv.json` (the CV itself, read by `/cv.json`), but the human-facing page only shows
  skills something published here actually backs. This is intentional curation, not a bug:
  don't add a placeholder proof just to make a skill appear.

### The pivot year

The boundary year shown in "Maintenant … → aujourd'hui" and "Avant … jusqu'à" is computed
from the oldest entry across `work` and `education` — it is not a constant to keep in sync
by hand. Adding an older entry moves the pivot automatically.

## `basics`

`name`, `label` and `summary` are required by the schema (summary is optional upstream, but
required here since it's rendered as the page's intro paragraph). `email`, `url`, `profiles`,
etc. are read by nothing on this page today — the schema still validates their shape if
present, but only `name`/`label`/`summary` are consumed.

## Wording (i18n)

Section labels and connective text live in `i18n/fr.toml` under the `parcours-*` and
`skills-*` keys (`parcours-now`, `parcours-since`, `parcours-before`, `parcours-until`,
`parcours-ongoing`, `parcours-skills`, `skills-daily`, `skills-direction`, `cv-json`). These
are UI strings, not content — change them here, not in `cv.json`, if the section headings or
connective phrasing need editing.

## Validating a change

`task qa` runs the full chain: `cv-schema` (schema validation), the Hugo build with any
`WARN` treated as failure (a missing `x_preuve` target, for instance), and the rest of the
project's lint suite. There is no separate command for just this page — a broken `cv.json`
fails the same gate as any other quality issue.
