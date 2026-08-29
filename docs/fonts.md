---
title: Font tooling — fontmake & fonttools
version: 1.0.0
date_published: 2026-08-29
date_modified: 2026-08-29
---

# Font tooling — fontmake & fonttools

`fontmake` and `fonttools` are used to manipulate the font sources for this project
(building/subsetting the `.woff2` files under `assets/styles/fonts/`). Debian marks the
system Python as externally managed (PEP 668), so `pip install` at the system level is
refused, and the `venv` module depends on `python3-venv`, which isn't installed on every
machine and needs `sudo` to add. This project keeps the toolchain in a local venv built
by [`uv`](https://docs.astral.sh/uv/) instead — `uv venv` creates the environment itself
without going through the system's `ensurepip` — and versions the exact package set with
the repo the same way `package.json` pins JS dependencies.

`uv` itself is a prerequisite, installed once per machine (not vendored in the repo),
same as Hugo or Node.

## Setup

```sh
task setup:fonts
```

Creates (or refreshes) `scripts/fonts/.venv/` and installs the exact pinned packages from
`scripts/fonts/requirements.txt` (`uv pip sync` — anything installed but not listed there
gets removed, so the venv always matches the lockfile). The venv itself is gitignored;
only the requirements file is tracked.

## Usage

Call the tools directly from the venv, no activation needed:

```sh
scripts/fonts/.venv/bin/fontmake --version
scripts/fonts/.venv/bin/python -c "import fontTools; print(fontTools.version)"
```

Or activate the venv for a session:

```sh
source scripts/fonts/.venv/bin/activate
```

## Updating the pinned versions

```sh
uv pip install --upgrade --python scripts/fonts/.venv/bin/python fontmake fonttools
uv pip freeze --python scripts/fonts/.venv/bin/python > scripts/fonts/requirements.txt
```

Commit the resulting `requirements.txt` diff.

## Rebuilding the Spectral variable fonts

See [ADR 0003](adr/0003-spectral-variable-font.md) for why this exists and the source
fixes it requires. To rebuild `Spectral-Variable.woff2` / `Spectral-Italic-Variable.woff2`:

```sh
# 1. Clone the pinned upstream commit (outside this repo, sources aren't vendored)
git clone https://github.com/googlefonts/spectral.git /tmp/spectral-src
git -C /tmp/spectral-src checkout 68414e1f632007dd6f51d1fa45bc365881aa2e2b

# 2. Apply the source fixes from ADR 0003 (axis map, glyph normalization, cmap dedupe)
#    — not scripted here; see the ADR for exactly what and why.

# 3. Build each style as a variable TTF
BIN=scripts/fonts/.venv/bin
cd /tmp/spectral-src/sources
"$BIN/fontmake" -m spectral-build-roman.designspace -o variable \
  --no-check-compatibility --output-path /tmp/roman.ttf
"$BIN/fontmake" -m spectral-build-italic.designspace -o variable \
  --no-check-compatibility --output-path /tmp/italic.ttf

# 4. Restrict wght to what's used (300–600), keeping it variable
"$BIN/python" -m fontTools.varLib.instancer -o /tmp/roman-300-600.ttf /tmp/roman.ttf wght=300:600
"$BIN/python" -m fontTools.varLib.instancer -o /tmp/italic-300-600.ttf /tmp/italic.ttf wght=300:600

# 5. Subset to the Latin/Western European charset actually used (French + English headroom)
UNICODES="U+0000-00FF,U+0100-017F,U+0180-024F,U+2000-206F,U+20AC"
"$BIN/python" -m fontTools.subset /tmp/roman-300-600.ttf --output-file=/tmp/roman-subset.ttf \
  --unicodes="$UNICODES" --layout-features='*' --glyph-names --symbol-cmap --legacy-cmap \
  --notdef-glyph --notdef-outline --recommended-glyphs --name-IDs='*' --name-legacy --name-languages='*'
"$BIN/python" -m fontTools.subset /tmp/italic-300-600.ttf --output-file=/tmp/italic-subset.ttf \
  --unicodes="$UNICODES" --layout-features='*' --glyph-names --symbol-cmap --legacy-cmap \
  --notdef-glyph --notdef-outline --recommended-glyphs --name-IDs='*' --name-legacy --name-languages='*'

# 6. Compress to WOFF2
"$BIN/python" -m fontTools.ttLib.woff2 compress -o assets/styles/fonts/Spectral-Variable.woff2 /tmp/roman-subset.ttf
"$BIN/python" -m fontTools.ttLib.woff2 compress -o assets/styles/fonts/Spectral-Italic-Variable.woff2 /tmp/italic-subset.ttf
```

Verify the axis came out right before committing — `fvar` should report `wght` 300/400/600
(min/default/max), not upstream's raw internal coordinates:

```sh
"$BIN/python" -c "
from fontTools.ttLib import TTFont
f = TTFont('assets/styles/fonts/Spectral-Variable.woff2')
a = f['fvar'].axes[0]
print(a.axisTag, a.minValue, a.defaultValue, a.maxValue)
"
```
