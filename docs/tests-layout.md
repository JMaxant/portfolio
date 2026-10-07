---
title: Playwright test suite
date_published: 2026-08-29
date_modified: 2026-10-06
---

# Playwright test suite

A real-browser test suite under `tests/`, separate from `task qa`'s static checks
(lint/format/build). It exercises rendered pages, not just source files.

## Scope

Despite the `test:layout` task name (historical — it started as an overflow-only check),
it now runs the whole suite:

| File | Covers |
|------|--------|
| `a11y.spec.js` | axe-core (`@axe-core/playwright`) on one page per template (`A11Y_PAGES` in `tests/pages.js`), in light, dark and system colour schemes. Rule sets: WCAG 2.0 to 2.2 A/AA, `best-practice` (landmark-unique, heading-order), plus `color-contrast-enhanced` (AAA) |
| `breadcrumb.spec.js` | Breadcrumb rendering |
| `breakpoints.spec.js` | Behavior at the `--bp-*` breakpoints (`docs/css-tokens.md`) |
| `byline.spec.js` | The `dl.byline` of an article and of a project: labelled entries, conditional update date and links, tags beside it |
| `details.spec.js` | The AI disclaimer: shown only when `aiDisclaimer` is set, closed by default, opened by the keyboard |
| `fonts.spec.js` | Body/headings resolve to Spectral (not a silent fallback), italic intro text |
| `footer.spec.js` | The `params.social` profiles are visible footer links with a text, on every template, and the footer navigation has a name |
| `headers.spec.js` | The generated `/_headers`: one canonical `Link` rule per publication section, the charset of the text files, no other rule |
| `keyboard.spec.js` | What axe cannot judge: skip-link, landmark names, keyboard-scrollable code blocks, theme switcher by keyboard, focus indicators, `prefers-reduced-motion` |
| `nav.spec.js` | Header/nav menu, including the mobile burger panel and the active trail |
| `overflow.spec.js` | No horizontal overflow across pages, at default size and (WCAG 1.4.4) at 200% text |
| `sticky-footer.spec.js` | Footer stays pinned on short pages |
| `table.spec.js` | Table rendering (`render-table.html`) |
| `theme-switcher.spec.js` | Light/dark toggle |
| `time.spec.js` | Date/time formatting |
| `live/smoke.spec.js` | Post-deploy smoke tests against a deployed site, never run locally; see [post-deploy-checklist.md](post-deploy-checklist.md) |

## Fixtures

Suites never target editorial pages. `tests/fixtures/content/` holds minimal pages tailored
to each assertion (a title long enough to overflow at 320px, an intro, a dated watch entry,
a table), and `tests/pages.js` exports their URLs as `FIXTURES`.

`tests/hugo.toml` mounts that directory over `content/` and is passed to the test server
only (`--config tests/hugo.toml` in `playwright.config.ts`), so the production build never
sees it. It is merged over `config/_default/`, and redeclares the default `content` mount
because declaring any mount drops it. The server keeps `--environment production`, so the
minified, fingerprinted CSS is what gets tested.

A new test needing a content property adds a fixture rather than borrowing a real page.
Two things still depend on real content, on purpose: the section lists (`/blog/`, `/tags/`,
structural) and the `Parcours` menu entry in `nav.spec.js`, which tests `menus.toml`.

With `reuseExistingServer`, a `hugo server` already running on port 1414 is reused and
serves no fixtures: stop it before running the suite locally.

## Why not in `task qa`

Full browser automation (downloading Chromium, booting a real Hugo server, rendering every
page) is too slow for a pre-commit hook or a run on every file save. `task qa` stays static
and fast; this suite runs on demand and in CI.

## Running it

```sh
task test:layout
```

Chromium only, for a fast local loop (`playwright.config.ts` also defines `firefox` and
`webkit` projects). Downloads the Chromium build on first run
(`task test:layout:browser`, called automatically).

CI (`.github/workflows/playwright.yml`) runs the full suite across all three browsers on
every push/PR to `main`, independently of `ci.yml`'s `quality`/`links-internal` jobs.

## Against a deployed site

```sh
task test:live -- https://www.example.com
```

`BASE_URL` swaps the local server for that URL and restricts the run to `tests/live/`, which
use real content. The other specs depend on fixtures and stay local. See
[post-deploy-checklist.md](post-deploy-checklist.md).
