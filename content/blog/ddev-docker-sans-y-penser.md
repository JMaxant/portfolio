+++
date = '2026-09-23'
draft = false
title = 'DDEV : Docker sans avoir à écrire un docker-compose.yml'
description = "Ce que DDEV automatise par-dessus Docker pour un projet Drupal — et ce qui reste à comprendre en dessous."
tags = ['docker', 'drupal']
translationKey = 'ddev-docker-sans-y-penser'
cover = ''
+++

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Le premier réflexe face à
Docker sur un projet PHP, c'est d'écrire son propre `docker-compose.yml` — service
web, service base de données, volumes, réseau. DDEV part du principe que ce fichier,
sur 90% des projets Drupal ou WordPress, ressemble toujours à la même chose : sed do
eiusmod tempor incididunt ut labore.

## Ce que DDEV automatise concrètement

DDEV est un CLI qui génère et pilote un `docker-compose.yaml` pour vous, dans
`.ddev/`, à partir d'un fichier de config (`.ddev/config.yaml`) qui tient en
quelques lignes : le type de projet (`drupal10`, `wordpress`, `laravel`...), la
version de PHP, le moteur de base de données. Le fichier compose complet reste
généré et lisible, pas caché — mais on ne l'écrit plus à la main pour les besoins
courants.

Quelques services viennent avec, sans configuration :

* Un routeur partagé (`ddev-router`) qui expose chaque projet sur son propre nom de
  domaine local (`monprojet.ddev.site`) avec TLS valide (via `mkcert`), sans conflit
  de port entre projets démarrés en parallèle.
* Un toggle Xdebug en une commande (`ddev xdebug on`), plutôt qu'un réglage `php.ini`
  à éditer et recharger.
* Import/export de base de données en une commande (`ddev import-db`,
  `ddev export-db`), avec gestion native des dumps compressés.

## Ce que ça change au quotidien

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit
esse cillum dolore eu fugiat nulla pariatur.

```bash
ddev config --project-type=drupal10 --php-version=8.3
ddev start
ddev composer install
ddev launch
```

## Pourquoi pas du Docker Compose à la main

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
mollit anim id est laborum.

## Ce qui a coincé

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore.
