+++
date = '2026-10-16'
draft = true
title = 'Facilitez-vous la vie avec Taskfile'
description = "En termes de tooling ou de task runners, Makefile a longtemps été la référence. Et pour cause : standard historique, disponible nativement sur les environnements Linux. Et puis j'ai découvert Taskfile ..."
tags = ['Tooling']
translationKey = 'taskfile-mon-amour'
aiDisclaimer = "Partiel (relecture, corrections)"
images = []
+++

Sur tous mes projets, je récupère plus ou moins la même Makefile. Elle déclare des tâches type `setup`, `update`, `build`,
`cache:clear`, et en général j'adapte ces commandes à la stack du projet ; le build exécutera `gulp`, `npm run build` ou
`yarn` selon le projet. C'est pratique, ça réduit le temps d'onboarding parce que, d'un projet à l'autre, je n'ai pas à
me poser la question de savoir quelle commande je dois exécuter pour réaliser une action donnée.

Mais Makefile, ce n'est pas sans inconvénients : la compatibilité cross-platform est inégale (bien que, dès lors
qu'un projet tourne sous Docker, beaucoup de ces problèmes sont réglés), c'est un peu rigide si on veut avoir des tâches
polyvalentes (je pense à la récupération de dump d'environnements distants différents avec `drush sql:sync`).
Accessoirement, j'utilise la même Makefile depuis bientôt 8 ans, et il y a cette tâche que je ne comprends toujours pas :

```makefile
help:
 @grep -E '(^[a-zA-Z_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'
```

Cette commande sert à afficher la liste des tâches disponibles avec `make help`.

Mais : insérez ici un panneau "Here be dragons", car ça fonctionne, mais je n'ai aucune idée de comment. C'est un peu
ésotérique, et vous trouverez cette commande sur toutes les Makefile du monde (ou presque).

## Et c'est alors que je découvris Taskfile

Le côté un peu abscons et daté de Makefile a été, étonnamment, un des principaux points de friction quant à son adoption
à chaque fois que je portais le sujet (ça et les habitudes, mais c'est attendu dans la conduite du changement).

Taskfile, en revanche, a cet avantage de miser sur la clarté : c'est du `yaml`, on déclare ses tâches sous la clé `tasks`,
ses variables sous la clé `vars` et la documentation est à la fois bien fournie et très explicite.

À titre de comparaison, la tâche `help` ci-dessus est déclarée ainsi :

```yaml
tasks:
  default:
    desc: List available tasks.
    cmd: task --list # Affichera la liste des tâches ayant une desc.
```

C'est tout de même plus convivial.

Et les avantages ne s'arrêtent pas là ! Taskfile, c'est :

* nativement cross-platform
* facile à étendre ou surcharger
* riche de fonctionnalités avancées (`watch: true` ou `-w/--watch`, prise en charge des `.env`)

Si je devais, pour être honnête, lui trouver un inconvénient, c'est que le binaire nécessite une installation, là où
`make` est globalement disponible sur tous les environnements Linux.

Pour le développement de ce portfolio, par exemple, j'ai [une Taskfile](https://github.com/JMaxant/portfolio/blob/main/Taskfile.yml)
qui me permet de gérer toutes les étapes, hors versionnage, du projet (lancement du serveur Hugo, build des assets, `qa`).

## Un petit aperçu des possibilités

### Facilité d'extension et gestion des namespaces

Les Taskfiles viennent avec un [système de priorisation](https://taskfile.dev/docs/guide/running-tasks#supported-file-names) :
un `Taskfile.dist.yaml` sera supplanté par un `Taskfile.yaml`.

Concrètement, ça veut dire que si l'on versionne le `.dist.yaml` et que l'on ajoute `Taskfile.yaml` au `.gitignore` :

* `task` utilisera `Taskfile.dist.yaml` tant qu'aucun `Taskfile.yaml` n'existe
* je pourrai copier le `dist.yaml` en `.yaml` et le modifier à volonté sans impacter les autres membres de l'équipe

Mais en plus de ça, les Taskfiles gèrent un système de namespace qui ressemble à ceci :

```yaml
includes:
  docker:
    taskfile: Taskfile.docker.yml
    optional: true
  front:
    taskfile: ./path/vers/app.js/Taskfile.front.yml
    dir: ./path/vers/app.js
```

Dans cet exemple `docker` et `front` sont donc des namespaces :

* `docker` inclut une Taskfile _si elle existe_
* `front` inclut la Taskfile spécifiée, et exécute ses tâches dans le répertoire `dir`

Ces inclusions ajoutées, les tasks qui y sont déclarées seront exécutables avec `task {namespace}:{task}` (par exemple :
`task docker:up`).

### Gestion des variables

Les variables se déclarent à plusieurs niveaux :

* globales sous la clé `vars` en tête du fichier
* locales au niveau d'une tâche
* les arguments passés après `--` (`task ma_tache -- mon_argument`), lus avec `.CLI_ARGS`
* ou directement à l'appel de la tâche avec `task ma_tache VAR=ma_valeur`

```yaml
vars:
  USER: 'Julien'

tasks:
  greet:
    cmd: echo "Hello {{ .USER }} !" # task greet affichera "Hello Julien !"

  hello-world:
    vars:
      USER: 'world'
    cmd: echo "Hello {{ .USER }} !" # task hello-world affichera "Hello world !"

  # Il s'agit là d'un exemple naïf : tout input doit être validé.
  custom-greet:
    cmd: echo "Hello {{ .CLI_ARGS }} !" # task custom-greet -- "test" affichera "Hello test !"
```

Notons au passage que la syntaxe `{{ }}` est celle des templates Go, enrichie de [slim-sprig](https://sprig.taskfile.dev/) :
elle supporte donc conditions, boucles et filtres.

Il y a une spécificité au sujet de la priorité des variables : une variable déclarée localement l'emporte sur une
variable globale ou surchargée :

```bash
task greet USER="Bob" # => Hello Bob !
task hello-world USER="Bob" # => Hello world !
```

Quant aux `{{.CLI_ARGS}}`, s'ils ne sont pas exploités dans la commande, ils seront ignorés. Il est en revanche
nécessaire de les valider en situation réelle, sinon la valeur passée est injectée telle quelle et on risque de passer
un mauvais moment.

Et "Quid des .env" me direz-vous ?
Eh bien :

```yaml
dotenv: ['.env', '.env.docker']
```

Et vos variables d'environnement sont chargées.

### Dépendances et préconditions

Deux propriétés différentes : d'abord `deps` :

```yaml
tasks:
  hello:
    cmd: echo "Hello"

  world:
    cmd: echo "World"

  greet:
    deps: [hello, world]
    cmd: echo "The world was hello-ed !"
```

Les deux tâches déclarées dans `deps` seront exécutées _avant_ la `cmd` de la tâche appelée. Deux subtilités :

1. Ces tâches sont exécutées en parallèle, donc la sortie pourrait être `Hello World` comme `World Hello`
2. Si une des `deps` échoue, alors `task greet` échouera

Ensuite `preconditions` déclare des conditions à remplir pour que la tâche s'exécute. Si l'une échoue, Taskfile affiche le
`msg` et s'arrête avec une erreur, sans lancer la commande :

```yaml
tasks:
  check-env:
    preconditions:
      - sh: test -f .env
        msg: "Missing .env !"
    cmd: echo ".env found."
```

Sans `.env`, `task check-env` affiche « Missing .env ! » et `cmd` ne sera pas exécutée.

## Pour finir

Vous avez une Makefile et elle répond à vos besoins ? Eh bien : parfait.

En revanche, si vous commencez un nouveau projet, ou que vos besoins évoluent, alors la migration vers une Taskfile a
son intérêt : l'évolutivité, la lisibilité et la facilité de prise en main. Je n'ai pas couvert, dans cet article, la
moitié des features et des cas d'usage (allez voir [la doc officielle](https://www.taskfile.dev) si vous êtes curieux).
Au-delà de son apport évident en tant que task runner, Taskfile est aussi un excellent outil de facilitation et de
documentation par son côté explicite. Et fini, le petit margoulin qui vous
dira que la Makefile ne fonctionne pas parce qu'il a décidé de rester sous Windows.

La migration de l'un vers l'autre est suffisamment rapide pour que ça vaille le coup de tester. Dans le pire des cas,
c'est une petite heure à faire du YAML (ce qui est, de toute façon, ce que l'on fait le plus souvent).

Une mise en garde, tout de même : le but d'une Taskfile n'est pas de remplacer un script dédié, mais de se faciliter la
vie. Il peut être tentant d'y mettre des `preconditions` complexes ou des variables dynamiques avancées avec le
templating intégré, mais c'est contre-productif.

## Approfondir, en savoir plus

* [La documentation](https://taskfile.dev/docs/)
* [Blog de Stéphane Robert](https://blog.stephane-robert.info/docs/developper/autres-outils/build/task/)
