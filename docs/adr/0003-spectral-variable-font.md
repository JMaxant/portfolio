---
title: ADR 0003 — Self-build a Spectral variable font from upstream UFO sources
version: 1.0.0
date_published: 2026-08-29
date_modified: 2026-08-29
---

# Self-build a Spectral variable font from upstream UFO sources

Status: accepted

Refs #120. The site self-hosted Spectral (see the commit adopting it as `--font-serif`) as
6 static `.woff2` files: 3 roman weights (Light 300, Regular 400, SemiBold 600) and their
italics. This ADR replaces those 6 files with 2 variable fonts — one roman, one italic —
each covering the whole 300–600 `wght` range in a single file.

## No official variable release

Spectral has no official variable font. Google Fonts serves it as 7 static weights only.
The buildable source lives in the official Google-maintained repo
[`googlefonts/spectral`](https://github.com/googlefonts/spectral) (OFL-1.1, pinned at
commit `68414e1f632007dd6f51d1fa45bc365881aa2e2b`), which ships UFO masters and two
`.designspace` files (`spectral-build-roman.designspace`, `spectral-build-italic.designspace`).
Their own build pipeline (`sources/BUILD.txt`) produces only their static release — it needs
`afdko`, `ttfautohint`, `woff2_compress` and five more external tools, and does not build a
variable font at all. `fontmake -o variable` against the same designspace does, using only
`fontmake`/`fonttools` (`docs/fonts.md`, `task setup:fonts`).

Sources aren't vendored into this repo — same pattern as the previous static files, which
shipped as committed binaries with no build sources in-tree. The pinned commit above is the
audit trail; `assets/styles/fonts/OFL.txt` is the upstream license, copied verbatim (the
previous static files shipped with no license file at all — this fixes that gap too).

## Two files, not one

A single variable font would need a combined `wght`+`ital` axis. Spectral's sources don't
have one — only two separate designspaces, roman and italic, each with just a `wght` axis.
Merging them into one file would mean redesigning part of the UFO sources ourselves
(adding an `ital` axis), which is font-design work well beyond a build/export task and
fragile to maintain against upstream updates. Two files — down from 6 — is the realistic
ceiling here.

## Weight range: 300–600, not the full 200–800

The upstream axis spans ExtraLight (200) to ExtraBold (800). Only 300/400/600 are used
anywhere in the codebase (`--font-weight-light`/`normal`/`bold`, `docs/css-tokens.md`) —
the same "nothing beyond what's used" call as ADR 0002's four Alexandria weights. The built
variable font is restricted to `wght` 300–600 with `fonttools varLib.instancer` after the
initial build.

## Glyph subset: Latin + Western European, not the full repertoire

Spectral's UFO sources carry 1481 glyphs covering Cyrillic, Greek, Armenian, Georgian,
Hebrew and Arabic-adjacent scripts, plus small-caps/alternates for all of them — none of it
reachable by this site's French content (or a future English translation, which needs
strictly less than French). Same "nothing beyond what's used" call as the weight range,
applied to glyph coverage.

After building and restricting the weight axis, each file is subset with `fonttools subset`
to Basic Latin + Latin-1 Supplement + Latin Extended-A/B + general punctuation + € (`U+0000-00FF,
U+0100-017F,U+0180-024F,U+2000-206F,U+20AC`) — 810 glyphs, covers French and English plus
headroom for most other Latin-script languages (Polish, Czech, Turkish, etc.) should the
site expand there; a non-Latin script would need revisiting this range. `fvar`/`gvar`/`avar`
survive subsetting intact — the variable axis still works, just over a much smaller glyph
set.

Combined effect of the weight restriction and the glyph subset: roman+italic together are
~128 KB, vs. ~532 KB for the previous 6 static files (~4x smaller).

## Build-time source fixes

Spectral's raw UFO masters don't compile as-is:

- The designspace's `wght` axis has no `<map>` — its internal design coordinates (0–1000,
  non-linear, e.g. SemiBold sits at 440→640 rather than 400→600) would otherwise leak
  directly into the font's public `fvar` axis, making a CSS declaration like
  `font-weight: 300 600` address the wrong region of the design space entirely. A `<map>`
  translating the standard OpenType weight classes (200/300/.../800) to the masters'
  internal locations (0/260/.../1000) was added to both designspace files before building.
- A handful of glyphs (Cyrillic `uni0423`, a couple of accent-composition glyphs, some
  Cyrillic small-caps) have genuinely incompatible outline structure between masters —
  Spectral's own static pipeline never needs to interpolate between them, so this was
  never caught upstream. Rather than deleting these glyphs (which breaks `features.fea`
  references to them), each was made structurally identical across the three masters by
  copying the Regular master's contours over — irrelevant to this site's Latin/French
  content, and avoids any feature-table surgery. `fontmake --no-check-compatibility` was
  used for the remaining soft anchor-position mismatches in unused glyphs, which don't
  block compilation.
- One data bug: `apostrophemod` and `uni02BC` both claimed U+02BC, which `ufo2ft` refuses
  (ambiguous cmap entry). Dropped the codepoint from `uni02BC`, keeping it on
  `apostrophemod`.

None of this touches glyphs actually reachable through this site's content; verified with a
rendered preview across 300/400/600, roman and italic, before shipping.
