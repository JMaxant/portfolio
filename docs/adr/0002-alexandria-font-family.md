---
title: ADR 0002 — Adopt Alexandria as the sans-serif font family
version: 1.0.0
date_published: 2026-08-16
date_modified: 2026-08-16
---

# Adopt Alexandria as the sans-serif font family

Status: accepted

Issue #86 asked for a distinct sans-serif typeface instead of the `system-ui` stack that
`--font-sans` fell back to. We chose Alexandria from Bunny Fonts.

## Delivery: hosted import, not self-hosted

Bunny Fonts serves Alexandria only via its CSS API
(`@import url(https://fonts.bunny.net/css?family=alexandria:200,300,400,600)`), not as
downloadable static files — unlike some other families on the service. Self-hosting the
`.woff2` files in `static/` and declaring `@font-face` locally, which is otherwise this
project's default for external assets, is not an option here without pulling the files
from a third-party GitHub mirror of Google's font sources, which we did not want to trust
as a supply chain for a font shipped to every visitor.

We accepted the trade-off: one external request to `fonts.bunny.net` at first paint,
mitigated with `<link rel="preconnect" href="https://fonts.bunny.net" crossorigin>` in
`baseof.html`. Bunny Fonts is GDPR-oriented (no IP logging, EU-based), which is why it was
picked over Google Fonts directly.

## Variants

Four weights are imported: 200, 300, 400, 600. These map to the weights already in use
across the site before this change (`04-header.css` hardcoded 200 and 300, `01-tokens.css`
already had `--font-weight-normal: 400` and `--font-weight-bold: 600`). No other weight is
used anywhere in the codebase, so nothing beyond these four was requested — each variant is
a separate HTTP payload.

The 200 weight is now tokenized as `--font-weight-thin`, matching the existing
`--font-weight-light` / `--font-weight-normal` / `--font-weight-bold` tokens (see
`docs/css-tokens.md`).

No italic variant was requested. Alexandria has none available on Bunny Fonts at all —
neither hosted nor importable — so this isn't a scope decision, it's a hard constraint.
`.single__intro` (`10-single.css:39`) sets `font-style: italic` with no `font-family`
override, so it inherits `--font-sans` and will render with the browser's synthetic
(faux) oblique rather than a true italic cut. The italics inside `.chroma` code blocks
(`11-code.css`) are unaffected — `pre` is pinned to `--font-mono` (`02-base.css:87`), not
`--font-sans`.
