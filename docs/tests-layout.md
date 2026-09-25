---
title: Playwright test suite
version: 1.1.0
date_published: 2026-08-29
date_modified: 2026-09-25
---

# Playwright test suite

A real-browser test suite under `tests/`, separate from `task qa`'s static checks
(lint/format/build). It exercises rendered pages, not just source files.

## Scope

Despite the `test:layout` task name (historical — it started as an overflow-only check),
it now runs the whole suite:

| File | Covers |
|------|--------|
| `a11y.spec.js` | Automated accessibility checks (`@axe-core/playwright`) across `tests/pages.js`'s page list |
| `breadcrumb.spec.js` | Breadcrumb rendering |
| `breakpoints.spec.js` | Behavior at the `--bp-*` breakpoints (`docs/css-tokens.md`) |
| `fonts.spec.js` | Body/headings resolve to Spectral (not a silent fallback), italic intro text |
| `nav.spec.js` | Header/nav menu, including the mobile burger panel and the active trail |
| `overflow.spec.js` | No horizontal overflow across pages, at default size and (WCAG 1.4.4) at 200% text |
| `sticky-footer.spec.js` | Footer stays pinned on short pages |
| `table.spec.js` | Table rendering (`render-table.html`) |
| `theme-switcher.spec.js` | Light/dark toggle |
| `time.spec.js` | Date/time formatting |

## Known limitation

Several suites target real content pages by URL, so deleting or renaming a page breaks
them without any template regression. Tracked by #139.

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
