---
title: Switch clair / sombre
version: 1.0.0
date_published: 2026-08-03
date_modified: 2026-08-03
---

# Switch clair / sombre

Réf : issue #9, Phase 2 du [cahier des charges](cahier-des-charges.md) (section 6).

## Principe

Trois états possibles : clair, sombre, système (par défaut). Le choix explicite de
l'utilisateur est mémorisé en `localStorage` et prime sur la préférence système ;
en l'absence de choix, le thème suit `prefers-color-scheme`.

Stockage (`localStorage`, clé `theme`) :

- `"light"` ou `"dark"` — choix explicite de l'utilisateur.
- clé absente — pas de choix explicite, le thème suit le système.

Le choix explicite est répercuté par l'attribut `data-theme` sur `<html>`
(`data-theme="light"` / `data-theme="dark"`) ; l'attribut est absent quand
l'utilisateur suit le système.

## Fichiers

| Fichier                                         | Rôle                                                                        |
|--------------------------------------------------|------------------------------------------------------------------------------|
| `layouts/partials/theme-switcher.html`            | Groupe de 3 radios (clair/sombre/système), inclus depuis `nav.html`         |
| `assets/scripts/inline/theme-init.js`             | Anti-flash : pose `data-theme` avant le premier rendu                       |
| `assets/scripts/theme.js`                         | Synchronise le radio coché au chargement, écoute les changements            |
| `assets/styles/00-tokens.css`                     | Primitives (`--light-*`, `--dark-*`) et tokens sémantiques (`--color-*`)    |
| `assets/styles/04-theme.css`                      | Règles de bascule (`@media`, `[data-theme]`)                                |

## Fonctionnement

1. **Chargement de la page** — `theme-init.js` est inliné en tête du `<head>`
   (via `resources.Get` + `safeJS`, non différé) : il lit `localStorage`, et si une
   valeur explicite existe, pose `data-theme` sur `<html>` **avant** le premier
   rendu, pour éviter un flash du mauvais thème.
2. **Rendu du `<fieldset>`** — le radio "Système" est coché en dur dans le HTML
   (état par défaut, fonctionne sans JS). `theme.js`, chargé en différé via le
   bundle `resources.Match "scripts/*.js"`, coche ensuite le radio correspondant
   au choix stocké s'il y en a un.
3. **Changement de choix** — au `change` d'un radio, `theme.js` met à jour
   `localStorage` et `data-theme` : retrait des deux pour "Système", écriture
   sinon.
4. **CSS** — `00-tokens.css` déclare les couleurs primitives des deux palettes une
   seule fois, et assigne les tokens sémantiques (`--color-bg`, `--color-text`,
   `--color-link`...) au clair par défaut. `04-theme.css` réassigne ces mêmes
   tokens sémantiques dans trois contextes : `@media (prefers-color-scheme: dark)`
   (système), `:root[data-theme="dark"]` et `:root[data-theme="light"]` (choix
   explicite). Les sélecteurs `:root[data-theme=...]` ont une spécificité
   supérieure à `:root` seul, donc un choix explicite l'emporte toujours sur la
   préférence système, quel que soit l'ordre des règles dans le fichier.

## Accessibilité

Groupe de 3 radios plutôt qu'un bouton à cycle unique (`<fieldset>` + `<legend>`) :
l'état courant est visible directement sans avoir à cliquer pour le découvrir.
Palette et contrastes : voir section 6 du cahier des charges.
