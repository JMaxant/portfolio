---
title: CSS browser compatibility
version: 1.2.1
date_published: 2026-08-04
date_modified: 2026-08-09
---

# CSS browser compatibility

Ref: issues #63, #77. Browser baseline: **Chrome 105+, Firefox 121+, Safari 16+, Edge 105+** (see [qa-ci.md](qa-ci.md), "Baseline navigateurs").

## Division of work

Two tools enforce the baseline, each with a distinct role:

| Tool | Stage | Role |
|------|-------|------|
| `css.Build` (esbuild, `layouts/partials/css.html`) | Hugo build | Transpiles modern *syntax* down to the target browsers (native nesting, media query range syntax, vendor prefixes) |
| `stylelint-no-unsupported-browser-features` (`.stylelintrc.json`) | Lint (pre-commit + CI) | Blocks *runtime* features the browser must support natively — nothing can transpile them (e.g. container queries, `subgrid`) |

Vendor prefixes are part of the transpiler's job: write unprefixed properties only, `css.Build` inserts the prefixes required by the targets. No autoprefixer, no manual `-webkit-` prefixes.

The linter checks source files and does not know a transpiler runs afterwards. Features the transpiler handles are therefore false positives at lint time and belong in the plugin's `ignore` list. Everything else is a real compatibility error: fix the CSS, do not extend the list.

## Ignored features

| Feature | Reason |
|---------|--------|
| `css-nesting` | Transpiled by `css.Build` (verified: selectors are flattened in `public/`) |
| `css-media-range-syntax` | Transpiled by `css.Build` (verified: rewritten to `min-width`/`max-width` in `public/`) |
| `text-size-adjust` | Only meaningful on iOS Safari (via the `-webkit-` prefix); browsers that lack it do not need it, no degradation |
| `css-clip-path`, `css-masks` | Progressive enhancement: only used by `.visually-hidden`, where the 1px box with `overflow: hidden` already hides the content. `clip-path` merely removes rendering artefacts. The "partial support" flagged across the whole baseline concerns `path()` and SVG elements, not `inset()` on an HTML element. `clip` is not an option — deprecated, and rejected by `property-no-deprecated` |

### Entries removed on 2026-08-08

`css-scroll-behavior` and `css-appearance` were justified against an earlier Safari 15
baseline. Both features are natively supported from Safari 15.4, so raising the baseline
to Safari 16 (issue #63) made the plugin stop flagging them. Verified by removing each
entry and re-running Stylelint: no error is reported. `scroll-behavior` and `appearance`
are still used in `00-reset.css` and `03-theme.css` — only the exemptions became useless.

Note that `-webkit-appearance` is **no longer emitted** in the built CSS with the current
`safari16` target, contrary to what the removed entry claimed. No prefix is needed across
the whole baseline.

### Example corrected on 2026-08-09

The table above used to cite `:has()` as a blocked feature. That went stale the same way, and
for the same reason: `:has()` ships in Chrome 105 and Safari 15.4, so the plugin stopped
flagging it when the baseline rose to Safari 16 (#63). Verified by linting `.a:has(+ .b)`
against the current config — no error, and no entry in the `ignore` list either. Container
queries (*only partially supported by Edge 105, Chrome 105*) and `subgrid` (*not supported by
Edge 105-116*) do still fail, and are the accurate examples.

## Adding to the ignore list

Before ignoring a flagged feature, prove one of the two cases:

1. **Transpiled**: build the site (`hugo`) and confirm in `public/` that the feature no longer appears in the output CSS.
2. **Progressive enhancement**: the feature degrades gracefully — unsupported browsers render acceptable, unbroken output.

An exemption justified against an older baseline does not stay valid when the baseline is
raised. Re-test the list whenever the target browsers change: remove an entry, run
Stylelint, and drop it for good if nothing is reported.

If neither holds, the linter is right: rewrite the CSS or raise the baseline (in both `package.json` and `layouts/partials/css.html`).
