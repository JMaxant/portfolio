+++
date = '2026-09-23'
draft = false
title = 'Taskfile plutôt que Makefile ou npm scripts : ce que ça change au quotidien'
description = "Un seul runner pour npm, Hugo et les scripts qualité — retour sur task après quelques mois d'usage sur ce site."
tags = ['taskfile', 'outillage']
translationKey = 'taskfile-plutot-que-makefile'
cover = ''
+++

Lorem ipsum dolor sit amet, consectetur adipiscing elit. `task` remplace ici aussi
bien un Makefile qu'une collection de scripts npm : sed do eiusmod tempor incididunt
ut labore et dolore magna aliqua.

## Ce qu'il y a dans le Taskfile de ce site

Le `Taskfile.yml` de ce repo reste volontairement court : `setup` (installe les
dépendances npm et le hook `lefthook`), `qa` (lance exactement ce que la CI exécute,
`npx lefthook run pre-commit --all-files`), `qa:fix` (stylelint, taplo, markdownlint
en mode auto-fix), `test:layout` (suite Playwright), et `hugo:serve` avec trois alias
(`serve`, `dev`, `run`).

Le point notable : `task qa` n'est pas une commande à part qui *ressemble* à la CI,
c'est littéralement la même invocation de `lefthook` que le job `quality` de la CI
appelle — documenté dans `docs/qa-ci.md`. Aucune des deux définitions ne peut dériver
de l'autre puisqu'il n'y en a qu'une.

## Pourquoi pas un Makefile ou des scripts npm

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur.

```yaml
qa:
  desc: Run every quality check on all files (exactly what CI's quality job runs).
  cmd: npx lefthook run pre-commit --all-files
```

## Ce qui manque

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
mollit anim id est laborum.
