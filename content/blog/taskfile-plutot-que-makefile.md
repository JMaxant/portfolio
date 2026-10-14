+++
date = '2026-09-23'
draft = true
title = 'Taskfile plutôt que Makefile ou npm scripts : ce que ça change au quotidien'
description = "Un seul runner pour npm, Hugo et les scripts qualité — retour sur task après quelques mois d'usage sur ce site."
tags = ['Taskfile', 'Outillage']
translationKey = 'taskfile-plutot-que-makefile'
images = []
+++

_Plan suggéré, à rédiger : chaque liste ci-dessous indique ce que la section doit couvrir._

Accroche : `task` remplace ici aussi bien un Makefile qu'une collection de scripts npm.

- Le constat de départ en une phrase : un site Hugo qui mélange Node, Go, Python et
  Playwright, donc quatre façons de lancer des commandes.
- La promesse de l'article : un seul point d'entrée, `task`, et ce que ça change à l'usage.
- Le périmètre : retour d'expérience sur ce site, pas un comparatif exhaustif.

## Le problème de départ

- Ce qui existait avant : commandes tapées de mémoire, scripts npm, éventuellement un
  Makefile. Lesquelles, et ce qui coinçait.
- Un exemple concret de dérive : une commande de CI qui n'est plus celle que l'on lance en
  local.
- Le critère de choix : un seul endroit pour définir une commande, lisible par quelqu'un qui
  découvre le repo.

## Ce qu'il y a dans le Taskfile de ce site

Le `Taskfile.yml` de ce repo reste volontairement court : `setup` (installe les
dépendances npm et le hook `lefthook`), `qa` (lance exactement ce que la CI exécute,
`npx lefthook run pre-commit --all-files`), `qa:fix` (stylelint, taplo, markdownlint
en mode auto-fix), `test:layout` (suite Playwright), et `hugo:serve` avec trois alias
(`serve`, `dev`, `run`).

Le point notable : `task qa` n'est pas une commande à part qui _ressemble_ à la CI,
c'est littéralement la même invocation de `lefthook` que le job `quality` de la CI
appelle — documenté dans [`docs/qa-ci.md`](https://github.com/JMaxant/portfolio/blob/main/docs/qa-ci.md). Aucune des deux définitions ne peut dériver
de l'autre puisqu'il n'y en a qu'une.

## Pourquoi pas un Makefile ou des scripts npm

Points à comparer, un court paragraphe chacun :

- **Découvrabilité** : `task --list` affiche les tâches avec leur `desc`. Un `Makefile` n'a
  pas d'équivalent natif, et `npm run` ne liste que ce qui est dans `package.json`.
- **Hors npm** : ici, `package.json` a un bloc `scripts` vide. Le Taskfile pilote aussi
  `hugo`, `uv` (l'environnement Python des polices) et `playwright`, ce qu'un script npm
  fait mal quand le projet n'est pas d'abord un projet Node.
- **Syntaxe** : YAML contre les tabulations et les `$$` d'un Makefile, et pas d'échappement
  de guillemets dans du JSON.
- **Portabilité** : un binaire unique, là où `make` varie selon l'OS et sa version.
- **Alias et arguments** : `serve`, `dev` et `run` pour la même tâche, et `--` pour passer
  une URL à `task test:live`.
- **Ce que Make fait mieux** : le graphe de dépendances entre fichiers, avec la
  reconstruction incrémentale. À dire honnêtement, c'est le seul vrai point faible de `task`
  face à lui ici.

```yaml
qa:
  desc: Run every quality check on all files (exactly what CI's quality job runs).
  cmd: npx lefthook run pre-commit --all-files
```

## Ce que ça change au quotidien

- Le réflexe : on tape `task` pour savoir quoi faire, au lieu d'ouvrir un README.
- La précondition `node:check`, qui lit `.nvmrc` et échoue avec un message clair avant
  qu'une commande plante plus loin. Montrer le message d'erreur réel.
- Le cas `task qa` identique à la CI : ce que ça évite en revue, et le jour où ça a servi.
- Un exemple de tâche ajoutée en deux minutes, pour montrer le coût d'entrée.
- Le coût d'adoption : un outil de plus à installer, à mentionner dans `task setup` ou la
  doc.

## Ce qui manque

- Ce qu'un Taskfile ne fait pas : pas de cache sur les fichiers sources tant qu'on n'utilise
  pas `sources` et `generates`, à vérifier avant d'écrire cette phrase.
- Le Taskfile de ce site a grandi depuis la section précédente (`node:check`, `setup:fonts`,
  `test:live`, `hugo:build`) : mettre cette description à jour avant publication.
- Ce que l'on referait autrement, s'il y en a.

## En résumé

- Trois lignes : quand `task` vaut le coup, quand un simple script npm suffit.
- Un lien vers le `Taskfile.yml` du dépôt et vers la documentation de Task.
