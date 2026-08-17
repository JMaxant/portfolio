---
title: Quality gates — pre-commit & CI
version: 1.7.1
date_published: 2026-08-01
date_modified: 2026-08-17
---

# Quality gates — pre-commit & CI

Réf : issue #5, Phase 0 du [cahier des charges](cahier-des-charges.md) (section 15).

## Principe

`lefthook.yml` est l'**unique source de vérité** des checks qualité. Le hook pre-commit local et le job CI `quality` exécutent la même définition — la CI ne peut pas diverger du hook :

- **pre-commit local** : lefthook sur les fichiers stagés (`{staged_files}`).
- **CI** : `npx lefthook run pre-commit --all-files` sur tous les fichiers trackés.

Seule la vérification de liens vit uniquement en CI (trop lente pour un pre-commit).

## Les checks (`lefthook.yml`)

| Check                      | Outil                                  | Portée                                                                              |
|----------------------------|----------------------------------------|-------------------------------------------------------------------------------------|
| `editorconfig`             | `editorconfig-checker` (devDependency) | Règles `.editorconfig` : trailing whitespace, newline finale, encodage UTF-8, LF    |
| `conflict-markers`         | `git grep`                             | Marqueurs de conflit résiduels (`<<<<<<<`, `=======`, `>>>>>>>`) — fichiers trackés |
| `taplo-fmt` / `taplo-lint` | `@taplo/cli` (npx, épinglé)            | Format + lint TOML                                                                  |
| `markdownlint`             | `markdownlint-cli2` (npx, épinglé)     | Markdown, hors `docs/**`                                                            |
| `stylelint`                | `stylelint` (devDependency)            | CSS (`stylelint-config-standard` + `stylelint-config-recess-order` pour l'ordre des propriétés + `stylelint-no-unsupported-browser-features`) |
| `cv-schema`                | `ajv` (devDependency)                  | `scripts/quality/check-cv-schema.mjs`: `assets/cv.json` against `schemas/cv.schema.json` |
| `contrast`                 | `scripts/quality/check-contrast.mjs` (no dependency) | Contrast ratios of the `base/tokens.css` palette: 7:1 for text, 3:1 for `--*-border-strong`. Also fails on a colour token covered by no pair. See [css-tokens.md](css-tokens.md) |
| `actionlint`               | `actionlint` (via `go run`, épinglé)   | Workflows GitHub Actions (`.github/workflows/*.yml`)                                |
| `hugo-build`               | `scripts/quality/check-hugo-build.sh`  | `hugo --gc --minify`, tout `WARN` = échec                                           |

## Baseline navigateurs

Réf : issue #63 (relevée lors de l'issue #61). Cible : **Chrome 105+, Firefox 121+, Safari 16+, Edge 105+**.

- `stylelint-no-unsupported-browser-features` lit le champ `browserslist` de `package.json` pour flaguer, en amont, toute feature CSS hors baseline.
- `css.Build` (`layouts/partials/css.html`) reçoit la même baseline en dur (option `target`) et down-level la syntaxe non supportée (ex. nesting natif) au build.

Les deux listes sont dupliquées manuellement — pas d'outil de synchronisation (`browserslist-to-esbuild` ou équivalent) pour éviter une dépendance supplémentaire. En cas de changement de baseline, mettre à jour les deux (`package.json` et `layouts/partials/css.html`) ainsi que le README.

Répartition des rôles transpileur/linter et justification des features ignorées : voir [css-compat.md](css-compat.md).

## Workflows GitHub Actions

### `ci.yml` — chaque PR + push sur `main`

- **`quality`** : Node (version lue dans `.nvmrc`, cache npm) + toolchain Hugo → `npm ci` → `npx lefthook run pre-commit --all-files`.
- **`links-internal`** : build Hugo → [lychee](https://github.com/lycheeverse/lychee) en `--offline` sur `public/` — liens et ancres internes uniquement, déterministe (le `baseURL` absolu est remappé vers `public/`).

Concurrence : les runs de PR obsolètes sont annulés ; pas ceux de `main`.

### `links-external.yml` — hebdomadaire (lundi 06:00 UTC) + manuel

Build Hugo → lychee **en ligne** (liens externes inclus). En cas de liens morts : ouvre — ou met à jour si déjà ouverte — une issue labellisée `link-rot` avec le rapport. Ne bloque jamais une PR. Déclenchable manuellement : `gh workflow run links-external.yml`.

## Fichiers de configuration

| Fichier | Rôle |
|---|---|
| `lefthook.yml` | Définition des checks (source de vérité) |
| `lychee.toml` | Config lychee partagée interne/externe (ancres, retries, timeouts) |
| `.github/actions/setup-hugo/action.yml` | Composite action Go + Hugo extended — **la version de Hugo CI s'épingle ici** (input `hugo-version`) |
| `.markdownlint.yaml`, `.stylelintrc.json` | Configs linters |
| `.editorconfig` | Règles whitespace/newline/encodage — aussi appliquées à l'édition par les IDE qui le lisent nativement (PhpStorm, VS Code…) |
| `package.json` | devDependencies (ranges `^`, versions exactes figées par `package-lock.json`, installées via `npm ci` en CI) ; champ `engines` (Node minimal) ; `allowScripts` autorise le `postinstall` de lefthook, qui installe le hook git |
| `.nvmrc` | Version Node du projet — lue par nvm/fnm/mise en local et par `actions/setup-node` en CI (`node-version-file`) ; cohérente avec `engines` |

## Usage local

```sh
task setup   # npm ci — le hook git lefthook est installé par son postinstall (autorisé via allowScripts)
task qa      # tous les checks sur tous les fichiers = job CI `quality`
```

## Maintenance

- **Automatique (Dependabot, PR hebdo — `.github/dependabot.yml`)** : versions des actions GitHub (workflows + composite `setup-hugo`) et devDependencies npm.
- **Bump Hugo CI** : `.github/actions/setup-hugo/action.yml` (garder ≥ l'exigence du README).
- **Bump taplo / markdownlint / actionlint** : versions inline dans `lefthook.yml`.
- **Ajouter un check** : une entrée dans `lefthook.yml` suffit — le pre-commit et la CI le récupèrent tous les deux.
