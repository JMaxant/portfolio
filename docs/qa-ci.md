---
title: Quality gates — pre-commit & CI
version: 1.0.0
date_publication: 2026-08-01
date_modification: 2026-08-01
---

# Quality gates — pre-commit & CI

Réf : issue #5, Phase 0 du [cahier des charges](cahier-des-charges.md) (section 15).

## Principe

`lefthook.yml` est l'**unique source de vérité** des checks qualité. Le hook pre-commit local et le job CI `quality` exécutent la même définition — la CI ne peut pas diverger du hook :

- **pre-commit local** : lefthook sur les fichiers stagés (`{staged_files}`).
- **CI** : `npx lefthook run pre-commit --all-files` sur tous les fichiers trackés.

Seule la vérification de liens vit uniquement en CI (trop lente pour un pre-commit).

## Les checks (`lefthook.yml`)

| Check                      | Outil                                   | Portée                                                                                                       |
|----------------------------|-----------------------------------------|--------------------------------------------------------------------------------------------------------------|
| `whitespace-and-conflicts` | `git diff --check` (arbre vide → index) | Whitespace en fin de ligne + marqueurs de conflit résiduels, sur tous les fichiers trackés tels que commités |
| `taplo-fmt` / `taplo-lint` | `@taplo/cli` (npx, épinglé)             | Format + lint TOML                                                                                           |
| `markdownlint`             | `markdownlint-cli2` (npx, épinglé)      | Markdown, hors `docs/**`                                                                                     |
| `stylelint`                | `stylelint` (devDependency)             | CSS (`stylelint-config-standard`)                                                                            |
| `hugo-build`               | `scripts/quality/check-hugo-build.sh`   | `hugo --gc --minify`, tout `WARN` = échec                                                                    |

## Workflows GitHub Actions

### `ci.yml` — chaque PR + push sur `main`

- **`quality`** : Node 24 (cache npm) + toolchain Hugo → `npm ci` → `npx lefthook run pre-commit --all-files`.
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
| `package.json` | Versions épinglées de `lefthook` et `stylelint` (installées via `npm ci` en CI) |

## Usage local

```sh
task setup   # npm install + installation du hook git lefthook
task qa      # tous les checks sur tous les fichiers = job CI `quality`
```

## Maintenance

- **Bump Hugo CI** : `.github/actions/setup-hugo/action.yml` (garder ≥ l'exigence du README).
- **Bump lefthook / stylelint** : `package.json` (versions exactes).
- **Bump taplo / markdownlint** : versions inline dans `lefthook.yml`.
- **Ajouter un check** : une entrée dans `lefthook.yml` suffit — le pre-commit et la CI le récupèrent tous les deux.
