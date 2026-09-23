+++
date = '2026-07-12'
draft = false
title = 'Portfolio Hugo'
description = "Étude de cas : le site que vous consultez — pipeline CSS et qualité outillés pour tenir une baseline navigateurs et un contraste AAA sans y repasser à l'œil à chaque changement."
tags = ['hugo', 'css']
translationKey = 'portfolio-hugo'
status = 'terminé'
repo = 'https://github.com/JMaxant/portfolio'
demo = ''
role = 'Développeur'
featured = true
+++

Ce site : Hugo, thème [bear-cub](https://github.com/clente/hugo-bearcub) personnalisé,
CSS sur mesure sans framework, pipeline qualité (lint, tokens, contraste, build) qui
tourne à l'identique en local et en CI.

## Pourquoi Hugo

Projet perso avec un double objectif : une vitrine professionnelle pour recruteurs et
clients freelance, et un terrain d'entraînement pour monter en compétence sur du
templating Go, du CSS sans dépendance, et une chaîne CI/CD tenue de bout en bout — sans
sacrifier la lisibilité du contenu à la démonstration technique.

Un générateur de site statique répond aux deux à la fois. Côté vitrine, la cible
(recruteurs, agents de recherche) n'a pas de rendu JS à franchir pour indexer le
contenu, contrairement à une SPA. Côté apprentissage, le HTML/CSS produit reste la
sortie principale — pas de couche framework JS entre l'auteur et le résultat, donc
chaque décision (tokens, contraste, breakpoints) reste visible et vérifiable dans la
feuille de style elle-même plutôt que dissoute dans un système de composants.

## Contexte

* Site personnel, parti d'un squelette : thème installé, contenu en Lorem Ipsum, une
  seule page `content/_index.md`
* Aucune contrainte de delivery externe — le calendrier est le seul arbitre du scope
* Exigence posée dès la Phase 0 (avant tout contenu) : les quality gates et la CI
  existent avant que le contenu s'accumule, pas après
* Cible recruteurs/clients : le site doit rester une vitrine lisible, pas seulement un
  prétexte à empiler des scripts de vérification

## Les contraintes

* Pas de framework CSS, pas de PostCSS, pas d'autoprefixer — seul `css.Build` (esbuild,
  natif Hugo) prend en charge la transpilation et les préfixes vendeur
* Une baseline navigateurs explicite (Chrome 105+, Firefox 121+, Safari 16+, Edge 105+)
  à tenir, alors que deux mécanismes différents la couvrent : transpilation de syntaxe
  d'un côté, blocage de features runtime non transpilables de l'autre (`refs #63`)
* Contraste ciblé à AAA (7:1) plutôt que le AA/RGAA (4.5:1), sans dérive silencieuse
  tolérée à mesure que la palette ou les composants évoluent (`refs #57`)
* Aucune valeur de couleur, d'espacement ou de breakpoint écrite en dur dans un
  composant — tout doit venir d'un token déclaré une seule fois (`refs #69`, `#108`)
* Le hook pre-commit local et la CI doivent exécuter la même définition, pour qu'aucun
  contrôle qualité ne puisse diverger entre les deux (`refs #5`)

## Les choix écartés

* Une revue manuelle du contraste à chaque changement de palette : tolérable une fois,
  pas répétable sans dérive — d'autant que la palette est passée de AA à AAA en cours
  de route, avec des marges initiales aussi fines qu'entre 7,00 et 7,06
* Une exemption CSS ajoutée « au cas où » dans la config Stylelint plutôt que prouvée :
  une feature ignorée sans vérification empirique dans `public/` reste ignorée même
  quand la baseline évolue et que le support natif la couvre déjà
* Dupliquer la logique de vérification entre pre-commit et CI (deux configs qui
  divergent tôt ou tard) plutôt qu'une définition unique appelée par les deux

## Décisions techniques

* **Tokens CSS à deux niveaux d'indirection** : palettes brutes (`--light-*`,
  `--dark-*`) jamais consommées directement par un composant, tokens sémantiques
  (`--color-surface`, `--color-text-soft`…) seuls exposés. Le dark mode change en
  réassignant les tokens sémantiques dans un seul fichier, sans toucher aux
  composants.
* **Règle « zéro valeur en dur » appliquée par script**, pas seulement documentée :
  `check-tokens.mjs` échoue sur toute couleur, taille ou durée littérale hors
  `base/tokens.css` ; l'échappatoire est un commentaire `token-exception` justifié
  inline, jamais un ajout silencieux à une liste d'ignore.
* **Contraste vérifié automatiquement** : `check-contrast.mjs` lit les valeurs hex
  directement dans `tokens.css` (aucune valeur dupliquée dans le script) et calcule
  chaque paire de couleurs, texte à 7:1, composants à 3:1. Un token de couleur non
  couvert par une paire est aussi un échec — sinon un token ajouté plus tard n'est
  simplement jamais mesuré.
* **Breakpoints déclaratifs mais vérifiés à l'exécution** : les media queries ne
  peuvent pas lire une custom property, donc les valeurs (`768px`, `576px`) restent en
  dur — mais `check-breakpoints.mjs` échoue sur une largeur qui ne correspond à aucun
  token `--bp-*`, et sur un token que plus aucune query n'utilise.
* **Deux rôles distincts pour tenir la baseline navigateurs** : `css.Build` transpile
  la syntaxe (nesting, media query range syntax) à la compilation ; Stylelint
  (`stylelint-no-unsupported-browser-features`) bloque au lint les features runtime
  qu'aucun transpileur ne peut simuler (container queries, `subgrid`). Chaque entrée de
  la liste d'ignore Stylelint est justifiée par une vérification dans `public/` après
  build, pas supposée — deux entrées obsolètes (`:has()`, `scroll-behavior`) ont été
  retirées une fois la baseline remontée et le support natif confirmé.
* **`lefthook.yml` comme unique source de vérité qualité** : le hook pre-commit local
  tourne sur les fichiers stagés, la CI appelle la même commande sur l'ensemble des
  fichiers trackés — aucune règle qualité ne peut exister dans l'un sans exister dans
  l'autre.
* **Contenu piloté par cascade Hugo plutôt que par template dédié** : la section
  `/veille/` (teaser-only) utilise `build.render = 'link'` en cascade pour rester dans
  les collections (donc alimenter les pages `/tags/*`) sans générer de page de détail —
  contre `render = 'never'`, qui exclurait l'entrée de toute collection. Comportement
  vérifié après build (`--cleanDestinationDir`) plutôt que supposé : aucune page
  `public/veille/<entrée>/` générée, sitemap propre, RSS global exempt.

## Résultat

Pas de métrique de production comparable au cas Drupal — c'est un site personnel, pas
un site à trafic. L'angle est différent : une CI qui tolère zéro `WARN` Hugo, un
contraste et des tokens vérifiés par script plutôt que revus à l'œil, et un pre-commit
qui ne peut pas diverger de la CI par construction. Le pipeline qualité tient à jour
avec le contenu, pas après coup.
