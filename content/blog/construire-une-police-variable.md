+++
date = '2026-09-23'
draft = false
title = 'Compiler sa propre police variable : le cas Spectral'
description = "Pas de version variable officielle pour la police serif de ce site : reconstruire un font variable à partir des sources, quatre fois plus léger que les fichiers statiques."
tags = ['css', 'performance']
translationKey = 'construire-une-police-variable'
cover = ''
+++

Ce site sert la police serif Spectral en 2 fichiers `.woff2` de ~64 Ko chacun. Avant,
c'était 6 fichiers statiques pour ~532 Ko au total — un par graisse (light, regular,
semibold) et par style (romain, italique). Le problème : Spectral n'a **aucune version
variable officielle**. Google Fonts ne la sert qu'en statique. Il a donc fallu la
compiler soi-même à partir des sources.

## Statique vs variable, en une phrase

Une police "statique" est un fichier par graisse : un pour le 300, un pour le 400, un
pour le 600. Une police "variable" encode un axe continu (`wght`) dans un seul
fichier — le navigateur interpole entre les graisses définies plutôt que de charger
un fichier différent pour chacune. Sur ce site, `--font-weight-light` (300),
`--font-weight-normal` (400) et `--font-weight-bold` (600) tiennent donc dans un seul
fichier par style, romain et italique.

## Pas de release officielle, mais des sources buildables

Les sources UFO (le format d'échange des designers de fontes) de Spectral sont
publiques, maintenues par Google, dans
[`googlefonts/spectral`](https://github.com/googlefonts/spectral) (licence OFL-1.1).
Elles incluent deux fichiers `.designspace` — un pour le romain, un pour l'italique —
qui décrivent comment interpoler entre les masters de graisse. Le pipeline de build
officiel du dépôt ne produit que la release statique et dépend d'une demi-douzaine
d'outils externes (`afdko`, `ttfautohint`...). Recompiler la même source avec
`fontmake -o variable` produit une police variable, avec seulement `fontmake` et
`fonttools` — les deux seuls outils dont ce projet a besoin (`docs/fonts.md`).

Comme Debian empêche un `pip install` au niveau système et que le module `venv` n'est
pas toujours présent sans `sudo`, la toolchain Python vit dans un venv local créé par
[`uv`](https://docs.astral.sh/uv/) (`task setup:fonts`), avec les versions figées dans
`scripts/fonts/requirements.txt` — le même principe que `package.json` pour les
dépendances JS.

## Ne garder que ce qui sert

Rien n'oblige à livrer la police telle que ses sources la définissent :

* **L'axe de graisse** couvre 200 à 800 en amont ; seuls 300/400/600 sont utilisés
  dans ce projet. Après le premier build, `fonttools varLib.instancer` restreint
  l'axe à 300–600 — la police reste variable, juste sur une plage plus étroite.
* **Le jeu de glyphes** couvre en amont le cyrillique, le grec, l'arménien, le
  géorgien — 1481 glyphes, aucun atteignable par du contenu français (ou anglais).
  `fonttools subset` réduit à Latin + Latin-1 + Latin étendu A/B + ponctuation
  générale + `€`, soit 810 glyphes — de quoi couvrir le français, l'anglais, et une
  marge pour la plupart des langues latines (polonais, tchèque, turc...).

Combiné, l'axe restreint et le sous-ensemble de glyphes font passer romain + italique
de ~532 Ko à ~128 Ko : environ 4 fois plus léger, pour un rendu strictement identique
sur tout ce que le site affiche réellement.

## Trois bugs de compilation qui ne se voient qu'à l'usage

Les sources brutes ne compilent pas telles quelles :

1. **L'axe `wght` n'a pas de correspondance déclarée.** En interne, les coordonnées de
   design de Spectral ne sont pas linéaires — le SemiBold est stocké à la position 440
   plutôt qu'à 600. Sans `<map>` pour traduire les valeurs standard OpenType
   (200/300.../800) vers ces coordonnées internes, une règle CSS comme
   `font-weight: 300 600` aurait fini par pointer vers la mauvaise zone de l'espace de
   design. Un `<map>` a été ajouté aux deux `.designspace` avant le build.
2. **Des glyphes structurellement incompatibles entre masters** (quelques glyphes
   cyrilliques, des compositions d'accents) — jamais un problème pour le pipeline
   statique de Spectral, qui n'a jamais besoin d'interpoler entre eux. Plutôt que de
   les supprimer (ce qui aurait cassé des références dans `features.fea`), leurs
   contours ont été rendus identiques entre masters en copiant ceux du master
   Regular — sans effet sur le contenu réel du site.
3. **Une entrée cmap ambiguë** : `apostrophemod` et `uni02BC` réclamaient le même
   point de code (U+02BC), ce que `ufo2ft` refuse. Le point de code a été retiré de
   l'un des deux.

Vérification avant commit — que l'axe `fvar` reflète bien 300/400/600 et pas les
coordonnées internes brutes :

```py
from fontTools.ttLib import TTFont
f = TTFont('assets/styles/fonts/Spectral-Variable.woff2')
a = f['fvar'].axes[0]
print(a.axisTag, a.minValue, a.defaultValue, a.maxValue)
```

## Deux fichiers, pas un

Une police variable peut en théorie combiner plusieurs axes — graisse *et* italique
dans un seul fichier, avec un axe `ital`. Les sources de Spectral n'en ont pas :
chaque `.designspace` ne porte qu'un axe `wght`. Fusionner romain et italique
demanderait de retravailler les sources UFO elles-mêmes pour leur ajouter un axe —
un travail de conception de police, pas de compilation, et fragile à maintenir face
aux mises à jour amont. Deux fichiers restent le plancher réaliste ici, contre six
avant.

## Licence : pas de renommage nécessaire

Le nom d'une police modifiée ne doit être changé, sous OFL, que si la licence
originale déclare un *Reserved Font Name* — pas systématiquement à chaque
modification. `assets/styles/fonts/OFL.txt` n'en déclare aucun : rien ne suit la
ligne de copyright, et "Spectral" n'apparaît nulle part ailleurs dans le texte de
licence. Cette compilation reste une "Modified Version" au sens de l'OFL (reconstruite
depuis les sources, axe remappé, glyphes normalisés et sous-ensemble), mais conserve
légitimement le nom "Spectral" — dans les métadonnées internes de la police comme
dans `--font-serif`.
