# Portfolio

[![CI](https://github.com/JMaxant/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/JMaxant/portfolio/actions/workflows/ci.yml)

Personal site built with [Hugo](https://gohugo.io), using the [hugo-bearcub](https://github.com/clente/hugo-bearcub) theme.

## Requirements

- **Hugo extended** v0.164.0+ (custom `layouts/` overrides use `.Site.Language.Locale` and `hugo.Sites`, unavailable before Hugo v0.158.0 — see `layouts/_default/baseof.html`, `layouts/_default/rss.xml`, `layouts/partials/nav.html`)
- **Go** 1.26.5+ (Hugo Modules resolution — see `go.mod`)
- **Node/npm** (for `stylelint` and `lefthook` — see Setup below)

## CSS stack

- Plain CSS
- Numbered files in `assets/styles/` (e.g. `01-base.css`) are imported by `assets/styles/main.css`
- Built with Hugo's native `css.Build`
- Minified and fingerprinted in production only
- served with a linked sourcemap in development for debugging.

Target browser baseline:

- Chrome 105+
- Firefox 121+
- Safari 16+,
- Edge 105+

Used by `css.Build` to down-level unsupported syntax (e.g. native CSS nesting) and by [Stylelint](https://stylelint.io) (`stylelint-config-standard` + `stylelint-no-unsupported-browser-features`

See:

- the `browserslist` in `package.json`
- `layouts/partials/css.html`
- [Pre-commit/CI docs](docs/qa-ci.md)

## Setup

```sh
task setup
```

Runs `npm install` (Stylelint and [lefthook](https://github.com/evilmartians/lefthook), both pinned in `package.json`) and installs the lefthook pre-commit git hook (whitespace/conflict check, TOML/Markdown/CSS linting, strict Hugo build). TOML/Markdown linters run via ad-hoc `npx`, no install needed for those.

To run every check on all files (not just staged ones):

```sh
task qa
```

## CI

Two GitHub Actions workflows, independent of deployment:

- **`ci.yml`** (every PR + push to `main`):
  - `quality` — runs `lefthook run pre-commit --all-files`, so `lefthook.yml` stays the single source of truth and CI can never drift from the local hook.
  - `links-internal` — builds the site and checks internal links and anchors with [lychee](https://github.com/lycheeverse/lychee) (offline, no network flakiness).
- **`links-external.yml`** (weekly + manual trigger) — checks external links online; on dead links it opens or updates an issue labeled `link-rot`.

Shared lychee settings live in `lychee.toml`; the Hugo version used by CI is pinned in `.github/actions/setup-hugo/action.yml`.
