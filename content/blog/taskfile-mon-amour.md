+++
date = '2026-10-16'
draft = true
title = 'Taskfile, mon amour'
description = "En termes de tooling ou de task runners, Makefile a longtemps été la référence. Et pour cause : standard historique, disponible nativement sur les environnements Linux. Et puis j'ai découvert Taskfile ..."
tags = ['Tooling']
translationKey = 'taskfile-mon-amour'
aiDisclaimer = "Aucun (c'est pour ça que vous verrez des fautes d'orthographe)"
images = []
+++

Sur tous mes projets, je récupère plus ou moins la même Makefile. Elle déclare des tâches type `setup`, `update`, `build`
`cache:clear`, et en général j'adapte ces commandes à la stack du projet ; par exemple, le build par exemple exécutera
`gulp`, `npm run build` ou `yarn` selon les outils. C'est pratique, ça réduit le temps d'onboarding parce que, d'un
projet à l'autre, je n'ai pas me poser la question de savoir quelle commande je dois exécuter pour réaliser une action
donnée.

Mais Makefile, ce n'est pas sans inconvénients : la compatibilité cross-platform est parfois inégale (bien que, dès lors
qu'un projet tourne sous docker, beaucoup de ces problèmes sont réglés), c'est un peu rigide si on veut avoir des tâches
un peu souple (je pense à la récupération de dump d'environnements distants différentes avec `drush sql:sync` par exemple),
et surtout : j'utilise la même Makefile depuis bientôt 8 ans, et il y a cette tâche que je ne comprends toujours pas :

```makefile
help:
 @grep -E '(^[a-zA-Z_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'
```

Cette commande sert à afficher la liste des tâches disponibles avec `make help`.

Mais : insérez ici un panneau "Here be dragons", car ça fonctionne, mais je n'ai aucune idée de comment. C'est un peu
ésotérique, et vous trouverez cette commande partout sur toutes les Makefile du monde.

## Et c'est alors que je découvris Taskfile

Le côté un peu abscons et daté de Makefile a été, étonnamment, un des principaux points de frictions quant à son
adoption à chaque fois que je portai le sujet (ça et les habitudes, mais c'est attendu dans la conduite du changement).

Taskfile, en revanche, a cet avantage de miser sur la clarté : c'est du `yaml`, on déclare ses tâches sous la clé `tasks`,
ses variables sous la clé `vars` et la documentation est à la fois bien fournie et trés explicite.

À titre de comparaison, la tâche `help` ci-dessus est déclarée ainsi :

```yaml
tasks:
  default:
    desc: List available tasks.
    cmd: task --list
```

C'est tout de même plus convivial.

Et les avantages ne s'arrêtent pas la ! Taskfile, c'est :

* nativement cross-platform
* facile à étendre ou surcharger
* riche de fonctionnalités avancées (`watch: true` ou `-w/--watch`, prise en charge des `.env`)

Si je devais, pour être honnête, lui trouver un inconvénient, c'est que le binaire nécessite une installation, là où
`make` est globalement disponible sur tout les environnements Linux.

Pour le développement de ce portfolio, par exemple, j'ai [une Taskfile](https://github.com/JMaxant/portfolio/blob/main/Taskfile.yml)
qui me permet de gérer toutes les étapes, hors versionnage, du projet (lancement du serveur hugo, build des assets, `qa`).

## Un petit aperçu des possibilités

### Facilité d'extension et gestion des namespaces

Les Taskfiles viennent avec un [système de priorisation](https://taskfile.dev/docs/guide/running-tasks#supported-file-names) :
un `Taskfile.dist.yaml` sera écrasé par un `Taskfile.yaml`.

Concrètement, ça veut dire que si l'on versionne le `.dist.yaml` et que l'on ajoute `Taskfile.yaml` au `.gitignore` :

* `task` l'appellera par défaut, y compris si le `.yaml` n'existe pas
* je pourrai copier le ̀`dist.yaml` en `.yaml` et le modifier à volonté sans impacter les autres membres de l'équipe

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
* sous la forme d'un paramètre (une variable spéciale en fait) d'une task (avec `.CLI_ARGS` qui sont passés de la sorte
̀`task ma_tache -- mon_argument`)
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
    cmd: echo "Hello {{ .USER }} !" # task hello-world affichera "Hello World !"

  # Il s'agit là d'un exemple naïf : tout input doit être validé.
  custom-greet:
    cmd: echo "Hello {{ .CLI_ARGS }} !"' # task custom-greet -- "test" affichera "Hello test !"

```

Il y a une spécificité au sujet de la priorité des variables : une variable déclarée localement l'emporte sur une
variable globale ou surchargée :

```bash
task greet USER="Bob" # => Hello Bob !
task hello-world USER="Bob" => Hello World !
```

Quant aux `{{.CLI_ARGS}}`, s'ils ne sont pas exploités dans la commande, ils seront inutiles. Il est en revanché
nécessaire de les valider en situation réelle, sinon la valeur passée est injectée telle qu'elle et on risque de passer
un mauvais moment.

Et "Quid des .env" me direz vous ?
Et bien :

```yaml
dotenv: ['.env', '.env.docker']
```

Et vos variables d'environnement sont chargées.

### Prérequis et préconditions

Une tâche peut dépendre d'autres tâches via la clé `deps`. Elles seront exécutées avant la tâche elle-même, et _en
parallèle_ (si l'ordre compte, il faudra plutôt les appeler dans `cmds` avec `- task: ma-tache`).

Les préconditions, elles, permettent de vérifier que l'environnement est en état avant de lancer quoi que ce soit, et
d'échouer avec un message clair si ce n'est pas le cas. Sur ce portfolio, par exemple, je vérifie la version de Node
avant toute installation :

```yaml
tasks:
  node:check:
    internal: true
    vars:
      NODE_REQUIRED:
        sh: cut -d. -f1 .nvmrc
    preconditions:
      - sh: test "$(node -p 'process.versions.node.split(".")[0]')" -ge "{{.NODE_REQUIRED}}"
        msg: "Node {{.NODE_REQUIRED}}+ requis (.nvmrc)."

  setup:
    desc: Installe l'environnement de développement local.
    deps: [node:check]
    cmds:
      - npm ci
```

Notez au passage le `internal: true` : la tâche n'apparaît pas dans `task --list` et ne peut pas être appelée
directement. Elle n'existe que pour servir les autres.

Dans le même esprit, `requires` permet d'exiger qu'une variable soit définie, et `status` (ou le couple
`sources`/`generates`) de sauter une tâche si elle est déjà à jour. Pas besoin de relancer un `npm ci` si
`package-lock.json` n'a pas bougé, par exemple.

### Le templating

Vous l'aurez remarqué dans les exemples précédents : les `{{.VARIABLE}}` ne sont pas de la simple interpolation. Taskfile
utilise le moteur de templates de Go, enrichi des fonctions de la bibliothèque [slim-sprig](https://go-task.github.io/slim-sprig/).
On a donc accès aux conditions, aux boucles, aux filtres (`default`, `upper`, `trim`, ...) et à quelques fonctions
maison comme `{{OS}}` ou `{{ARCH}}`.

```yaml
tasks:
  open:
    desc: Ouvre le site local dans le navigateur.
    cmd: '{{if eq OS "darwin"}}open{{else}}xdg-open{{end}} http://localhost:1313'

  lint:
    desc: Lint chaque dossier de sources.
    vars:
      DIRS: assets/styles assets/scripts
    cmds:
      - for: { var: DIRS }
        cmd: echo "Lint de {{.ITEM}}"
```

C'est sans doute la fonctionnalité dont il faut le plus se méfier : c'est puissant, mais une Taskfile truffée de
conditions imbriquées devient vite aussi illisible que la tâche `help` de ma vieille Makefile. À utiliser avec
parcimonie, donc.

## En conclusion

Je ne vais pas vous mentir : Makefile n'est pas mort, et il reste un choix tout à fait valable, surtout quand on ne veut
rien installer de plus sur une machine. Mais pour un projet d'équipe, Taskfile coche toutes les cases : c'est lisible,
documenté, cross-platform, et assez souple pour couvrir des cas que je contournais jusque-là à grands renforts de
scripts bash.

Et surtout, c'est un outil que les gens _comprennent_. Pour faciliter l'adoption d'un task runner, c'est sans doute
l'argument qui compte le plus.

Alors si, comme moi, vous traînez une Makefile depuis des années sans trop savoir ce qu'elle fait, essayez Taskfile.
Au pire, vous aurez perdu une après-midi. Au mieux, vous ne reviendrez plus en arrière.
