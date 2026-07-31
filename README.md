# Portfolio

Personal site built with [Hugo](https://gohugo.io), using the [hugo-bearcub](https://github.com/clente/hugo-bearcub) theme.

## Requirements

- **Hugo extended** v0.123.7+
- **Go** 1.26.5+ (Hugo Modules resolution — see `go.mod`)

## CSS stack

Plain CSS, no preprocessor, no framework. Numbered files in `assets/styles/` (e.g. `01-base.css`), concatenated/minified/fingerprinted by Hugo's asset pipeline (`layouts/partials/custom_head.html`) in production only; served separately and unminified in development for debugging.

## Setup

```sh
task setup
```

Installs the [lefthook](https://github.com/evilmartians/lefthook) git hook (TOML/Markdown linting, strict Hugo build). Requires `lefthook` on `PATH`, plus Node/npm (linters run via `npx`, no global install needed).

### Installing lefthook (Debian/Ubuntu)

```sh
# Option 1 — official apt repo
curl -1sLf 'https://dl.cloudsmith.io/public/evilmartians/lefthook/setup.deb.sh' | sudo -E bash
sudo apt install lefthook

# Option 2 — via Go (already required for this project)
go install github.com/evilmartians/lefthook/v2@latest
```

Then check the binary is on `PATH` (`lefthook version`) before running `task setup`.
