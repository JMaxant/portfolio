---
title: CSS browser compatibility
version: 1.0.0
date_published: 2026-08-04
date_modified: 2026-08-04
---

# CSS browser compatibility

Ref: issue #63. Browser baseline: **Chrome 100+, Firefox 100+, Safari 15+, Edge 100+** (see [qa-ci.md](qa-ci.md), "Baseline navigateurs").

## Division of work

Two tools enforce the baseline, each with a distinct role:

| Tool | Stage | Role |
|------|-------|------|
| `css.Build` (esbuild, `layouts/partials/css.html`) | Hugo build | Transpiles modern *syntax* down to the target browsers (native nesting, media query range syntax, vendor prefixes) |
| `stylelint-no-unsupported-browser-features` (`.stylelintrc.json`) | Lint (pre-commit + CI) | Blocks *runtime* features the browser must support natively — nothing can transpile them (e.g. `:has()`, container queries, `subgrid`) |

The linter checks source files and does not know a transpiler runs afterwards. Features the transpiler handles are therefore false positives at lint time and belong in the plugin's `ignore` list. Everything else is a real compatibility error: fix the CSS, do not extend the list.

## Ignored features

| Feature | Reason |
|---------|--------|
| `css-nesting` | Transpiled by `css.Build` (verified: selectors are flattened in `public/`) |
| `css-media-range-syntax` | Transpiled by `css.Build` (verified: rewritten to `min-width`/`max-width` in `public/`) |
| `css-scroll-behavior` | Progressive enhancement: unsupported browsers (Safari < 15.4) fall back to instant scroll, nothing breaks |
| `text-size-adjust` | Only meaningful on iOS Safari (via the `-webkit-` prefix); browsers that lack it do not need it, no degradation |

## Adding to the ignore list

Before ignoring a flagged feature, prove one of the two cases:

1. **Transpiled**: build the site (`hugo`) and confirm in `public/` that the feature no longer appears in the output CSS.
2. **Progressive enhancement**: the feature degrades gracefully — unsupported browsers render acceptable, unbroken output.

If neither holds, the linter is right: rewrite the CSS or raise the baseline (in both `package.json` and `layouts/partials/css.html`).
