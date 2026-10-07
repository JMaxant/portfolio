+++
date = '2026-10-06'
lastmod = '2026-10-07'
draft = false
title = 'Portfolio Hugo'
description = "Ce site : créé avec Hugo ; pipeline CSS et qualité orientée accessibilité, maintenance et évolutivité."
tags = ['hugo', 'css']
translationKey = 'portfolio-hugo'
status = 'Terminé'
repo = 'https://github.com/JMaxant/portfolio'
demo = ''
role = 'Juge et partie'
featured = true
aiDisclaimer = "Partiel (plan et relecture)."
+++

**En bref :** un site que je voulais faire depuis longtemps, sans avoir sauté le pas.

D'un point de vue technique, je me suis imposé les contraintes suivantes :

* Performance et simplicité
* Robustesse
* Accessibilité (sans prétendre être un expert)
* Pas de framework (ni back, ni front)
* CI/CD et tests Playwright pour m'assurer que rien (ou presque) ne casse

Et ça a été l'occasion d'approfondir l'utilisation d'agents IA dans le développement et le suivi de projet.

## Contexte

L'objectif de ce site est multiple : une vitrine professionnelle, un espace d'expérimentation.
La réalisation de ce site devrait donc me permettre de me réapproprier le CSS, approfondir ma compréhension du templating Go ainsi que de mettre en place une CI GitHub.

Sur un projet personnel de ce genre, mon premier obstacle a toujours été le cadrage et la perte de motivation qui en découle, et c'est ici que l'usage d'agents IA (Claude) a été très efficace : utilisée dès le départ pour le cadrage et le suivi du projet, l'IA a permis de mener le projet à bien, sans (trop) dériver sur des besoins secondaires.

## Pourquoi Hugo

Mon cœur d'expertise full-stack se trouve plutôt sur des technos plus lourdes (Drupal, Symfony, Vue.js) : dès le départ, ces choix étaient hors concours.

Si une stack PHP ou JS complète présente un intérêt pour la gestion de contenu, le besoin étant un site purement édito, léger et épuré, elles sont éliminées d'office.

D'autres solutions (CMS flat-file type Grav) ont été envisagées, mais quitte à partir dans la simplicité, autant se passer de la stack Apache/Nginx + PHP, pour encore alléger l'hébergement.

Étant très amateur de Go, j'ai donc décidé d'utiliser Hugo et son tooling natif : `partials`, `css.Build`, `js.Build` etc.

## Choix techniques

* **YAGNI** (You Ain't Gonna Need It): pas de code "au cas où", c'est le plus souvent du bruit et du code mort

### Front

* CSS natif uniquement
* Baseline navigateurs explicite (Chrome 105+, Firefox 121+, Safari 16+, Edge 105+)
* Utilisation de tokens CSS pour définir une organisation stricte du front
* Règle "Zéro valeur en dur" : tokens complets et restrictifs à deux niveaux d'abstraction :
  * Tokens bruts (`--light-bg`, `--dark-bg`)
  * Tokens sémantiques (`--color-bg` récupérant la valeur light ou dark selon le thème sélectionné)
* Le hook pre-commit local et la CI doivent exécuter la même définition, pour qu'aucun
  contrôle qualité ne puisse diverger entre les deux
* `css.Build` transpile selon la baseline navigateurs
* Stylelint bloque les features non transpilables (container queries, subgrid)

### Accessibilité

* Les contrastes visant le niveau AAA (7:1) plutôt que le AA/RGAA (4,5:1)
  * Script de vérification (`check-contrast.mjs`) exécuté en précommit, dans la CI ou sur demande (`task qa`)
* Peu de JavaScript, templates basés sur les éléments HTML natifs autant que possible, respect du HTML sémantique
* Utilisation là où indispensable d'aria-* pour compenser ou compléter

### CI/CD, hébergement

* `lefthook` comme outil de qualité : exécution des tâches precommit mais aussi exécuté sur demande et dans la CI
* tests Playwright de non-régression
* Utilisation de `dependabot` pour les packages JS (pour les tests et le tooling local)
* Déploiement avec wrangler sur demande via workflow dédié dans github actions (déploiement depuis la branche main,
conditionné à une pipeline qualité valide)
* Hébergement via les Workers/Pages Cloudflare (gratuit sans limitation de bande passante tant que les assets déployés sont statiques)

### Back

S'il n'y a pas vraiment de back-end comme on l'entend traditionnellement, j'ai tiré parti des fonctionnalités d'Hugo
notamment pour le SEO/GEO :

* partial `json-ld.html` pour les données structurées schema.org (Website, ProfilePage, Article, BreadcrumbList)
* partial `seo-tags.html` pour les balises meta (description, author, og, canonical)
* fichier `llms.txt` généré à partir de `index.llms.txt` qui liste dynamiquement les pages
* version markdown des contenus rendue depuis `single.md`

Tous les partials déclarent un contrat, c'est-à-dire que les propriétés qui leur sont passées sont validées, toute valeur
invalide provoquant une erreur au build du site.

## Utilisation de l'IA dans le projet

L'IA a été capitale pour accélérer le cadrage et le suivi du projet.
Utilisé comme assistant, Claude a permis dès le départ de définir un cahier des charges et de réaliser un découpage des
tâches macro qui a résolu le plus gros écueil : le cadrage, c'est-à-dire savoir où l'on va.

Il s'agissait d'utiliser l'agent pour exposer mon besoin (prompt type `Je souhaite réaliser un portfolio avec telles
contraintes et tels buts`), puis d'itérer jusqu'à arriver à la rédaction du cahier des charges initial.

De ce cahier des charges, en ont été déduites les tâches initiales, puis, avec un token GitHub, puis transformées
en issues, réparties par milestones (Fondation/Scaffolding, Squelette de contenu, identité visuelle, SEO/GEO etc jusqu'à
Recette & Post MEP).

En utilisant la version de base de GitHub Projects et en prenant en compte une contrainte temps arbitraire, cela m'a permis de
visualiser l'étendue réelle du chantier et de prioriser ou dé-prioriser en fonction du temps que j'avais à y consacrer.

Pour la partie développement agentique, j'ai utilisé l'IA pour débloquer des situations où l'expertise me
manquait sur des sujets spécifiques à Hugo, ou faciliter ma prise en main et compréhension des pratiques CSS modernes
(nesting, grid-template-columns, gestion des tokens/custom properties).

Pour finir, l'IA a été particulièrement efficace dans la création et maintenance de documentation.

## Résultat

Le portfolio a été déployé début octobre, pour une date initiale à mi-septembre.
Des métriques de trafic ne sont ni disponibles (pas d'analytics par choix) ni pertinentes, en revanche les objectifs
initiaux sont atteints : le site est simple, performant, facile d'utilisation et documenté.

Les choix techniques (Hugo, CSS natif, hébergement) se sont révélés révélés pertinents, même si Hugo souffre
d'une prise en main parfois complexe, a minima obscure.

L'utilisation de l'IA a été un vrai atout en termes de gain de temps et d'efficacité, avec un bémol concernant la
documentation. Par défaut, un agent écrit pour un autre agent ; la vraie difficulté est de réussir à la contenir pour ne
pas perdre la maîtrise technique du projet.
