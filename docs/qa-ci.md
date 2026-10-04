---
title: Quality gates — pre-commit & CI
date_published: 2026-08-01
date_modified: 2026-10-04
---

# Quality gates — pre-commit & CI

Ref: issue #5, phase 0 of the [cahier des charges](cahier-des-charges.md) (section 15).

## Principle

`lefthook.yml` is the **single source of truth** for the quality checks. The local pre-commit hook and the `quality` CI job run the same definition, so CI cannot drift from the hook:

- **local pre-commit**: lefthook on the staged files (`{staged_files}`).
- **CI**: `npx lefthook run pre-commit --all-files` on every tracked file.

Only the link check lives in CI alone (too slow for a pre-commit).

## The checks (`lefthook.yml`)

| Check                      | Tool                                   | Scope                                                                               |
|----------------------------|----------------------------------------|-------------------------------------------------------------------------------------|
| `editorconfig`             | `editorconfig-checker` (devDependency) | `.editorconfig` rules: trailing whitespace, final newline, UTF-8 encoding, LF    |
| `conflict-markers`         | `git grep`                             | Leftover conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) — tracked files |
| `taplo-fmt` / `taplo-lint` | `@taplo/cli` (npx, pinned)             | TOML format + lint                                                                  |
| `markdownlint`             | `markdownlint-cli2` (npx, pinned)      | Markdown, outside `docs/**`                                                            |
| `stylelint`                | `stylelint` (devDependency)            | CSS (`stylelint-config-standard` + `stylelint-config-recess-order` for property order + `stylelint-no-unsupported-browser-features`) |
| `contrast`                 | `scripts/quality/check-contrast.mjs` (no dependency) | Contrast ratios of the `base/tokens.css` palette: 7:1 for text, 3:1 for `--*-border-strong`. Also fails on a colour token covered by no pair. See [css-tokens.md](css-tokens.md) |
| `breakpoints`              | `scripts/quality/check-breakpoints.mjs` (no dependency) | Every width media query under `assets/styles/` against the `--bp-*` tokens: fails on a width matching no token, on a query opening upwards (`min-width`), and on a token no query uses. See [css-tokens.md](css-tokens.md#breakpoints) |
| `tokens`                   | `scripts/quality/check-tokens.mjs` (no dependency) | Hardcoded design values under `assets/styles/`: colours, lengths, durations and `z-index` literals outside `base/tokens.css`. An idiom is accepted with a `/* token-exception: <reason> */` comment on the line. See [css-tokens.md](css-tokens.md#no-hardcoded-value) |
| `actionlint`               | `actionlint` (via `go run`, pinned)    | GitHub Actions workflows (`.github/workflows/*.yml`)                                |
| `hugo-build`               | `scripts/quality/check-hugo-build.sh`  | `hugo --gc --minify`, any `WARN` = failure                                          |

## Browser baseline

Ref: issue #63 (found during issue #61). Target: **Chrome 105+, Firefox 121+, Safari 16+, Edge 105+**.

- `stylelint-no-unsupported-browser-features` reads the `browserslist` field of `package.json` to flag, upstream, any CSS feature outside the baseline.
- `css.Build` (`layouts/partials/css.html`) gets the same baseline hardcoded (`target` option) and down-levels unsupported syntax (e.g. native nesting) at build time.

The two lists are duplicated by hand — no sync tool (`browserslist-to-esbuild` or equivalent), to avoid an extra dependency. When the baseline changes, update both (`package.json` and `layouts/partials/css.html`) and the README.

How the transpiler and the linter divide the work, and why some features are ignored: see [css-compat.md](css-compat.md).

## GitHub Actions workflows

### `ci.yml` — every PR + push to `main`

- **`quality`**: Node (version read from `.nvmrc`, npm cache) + Hugo toolchain → `npm ci` → `npx lefthook run pre-commit --all-files`.
- **`links-internal`**: Hugo build → [lychee](https://github.com/lycheeverse/lychee) with `--offline` on `public/` — internal links and anchors only, deterministic (the absolute `baseURL` is remapped to `public/`).

Concurrency: superseded PR runs are cancelled; `main` runs are not.

### `links-external.yml` — weekly (Monday 06:00 UTC) + manual

Hugo build → lychee **online** (external links included). On dead links: opens — or updates, if already open — an issue labelled `link-rot` with the report. Never blocks a PR. Can be triggered manually: `gh workflow run links-external.yml`.

## Configuration files

| File | Role |
|---|---|
| `lefthook.yml` | Check definitions (source of truth) |
| `lychee.toml` | lychee config shared by internal/external runs (anchors, retries, timeouts) |
| `.github/actions/setup-hugo/action.yml` | Hugo extended composite action — **the CI Hugo version is pinned here** (`hugo-version` input) |
| `.markdownlint.yaml`, `.stylelintrc.json` | Linter configs |
| `.editorconfig` | Whitespace/newline/encoding rules — also applied while editing by IDEs that read it natively (PhpStorm, VS Code…) |
| `package.json` | devDependencies (`^` ranges, exact versions locked by `package-lock.json`, installed with `npm ci` in CI); `engines` field (minimum Node); `allowScripts` allows lefthook's `postinstall`, which installs the git hook |
| `.npmrc` | `engine-strict=true` — `npm ci` refuses a Node outside `engines` |
| `.nvmrc` | Project Node version — read by nvm/fnm/mise locally and by `actions/setup-node` in CI (`node-version-file`); consistent with `engines` |

## Local usage

```sh
task setup   # npm ci — the lefthook git hook is installed by its postinstall (allowed via allowScripts)
task qa      # every check on every file = the `quality` CI job
```

### Node version

Node 24+ is required (`.nvmrc`, `engines.node`). Two guards enforce it locally:

- `engine-strict=true` in `.npmrc` makes `npm ci` fail on an unsupported Node. It only acts at install time.
- The `node:check` Taskfile precondition, a dependency of `task setup` and `task qa`, fails when the major
  version of `node --version` is below the one in `.nvmrc`. It covers a `node_modules` installed under
  Node 24 then run under an older one, where `editorconfig-checker` crashes yet exits 0 and lefthook
  reports it as passed.

CI is unaffected: both workflows read `node-version-file: .nvmrc`.

## Maintenance

- **Automatic (Dependabot, weekly PR — `.github/dependabot.yml`)**: GitHub Actions versions (workflows + `setup-hugo` composite) and npm devDependencies.
- **Bump CI Hugo**: `.github/actions/setup-hugo/action.yml` (keep it ≥ the README requirement).
- **Bump taplo / markdownlint / actionlint**: versions inline in `lefthook.yml`.
- **Add a check**: one entry in `lefthook.yml` is enough — pre-commit and CI both pick it up.
