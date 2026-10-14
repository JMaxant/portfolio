+++
date = '2026-09-23'
lastmod = '2026-10-14'
draft = false
title = 'Compiler sa propre police variable : le cas Spectral'
description = "Pas de version variable officielle pour la police serif de ce site : reconstruire un font variable à partir des sources, quatre fois plus léger que les fichiers statiques."
tags = ['CSS', 'Performance']
translationKey = 'construire-une-police-variable'
images = []
aiDisclaimer = "Partiel (corrections, ajouts des trois paragraphes finaux)"
+++

Ce site utilise [la police serif Spectral](https://www.1001fonts.com/spectral-font.html).
Cette police, c'est 1 fichier par style (romain et italique) **et** par graisse (light, regular et semibold), donc 3
graisses x 2 styles : 6 fichiers.

Au total, ça représente environ 532 Ko : autant dire que non seulement les outils type Lighthouse n'apprécient que peu
(et le font savoir), mais aussi que c'est _un peu dommage_ d'embarquer 532 Ko de fonts quand on essaie de garder un site
léger.

Mais alors que je hurlais mon désespoir face à cette injustice flagrante (j'avais du mal à me résoudre à choisir entre
"moche et rapide" et "un peu plus esthétique mais lourd") que je découvris les [polices variables](https://web.dev/articles/variable-fonts?hl=fr),
ce qui, sur le papier du moins, m'emplit de joie (car j'ai des plaisirs simples).

## Statique ou variable, c'est quoi ?

Les polices dites statiques, ce sont les polices que l'on connaît le plus, à savoir un fichier par graisse et style :
on aurait `mafont_light.woff2`, `mafont_light_italic.woff2`, `mafont_regular.woff2`, `mafont_regular_italic.woff2` etc.
Pour reprendre l'exemple du paragraphe précédent, ça revient à avoir 6 fichiers pour plus de 500 Ko. Quitte à me répéter,
c'est _un peu dommage_ d'avoir 6 requêtes pour un total approchant 5 fois le poids de la page, CSS et JS inclus.

À l'inverse, une police "variable", c'est une police qui encode un axe continu (`wght`) dans un seul fichier : le
navigateur interpole entre les graisses définies plutôt que de charger un fichier différent pour chacune.
Sur ce site, `--font-weight-light` (300), `--font-weight-normal` (400) et `--font-weight-bold` (600) tiennent dans un
seul fichier par style, romain et italique.

## Build sa police variable à partir des sources

Dans le cas de Spectral, la police variable n'existe pas (pas de release officielle). Heureusement, il est possible de
build sa propre police variable à partir des sources UFO (le format d'échange des designers de polices), qui, dans ce
cas, sont publiques et maintenues par Google, dans [`googlefonts/spectral`](https://github.com/googlefonts/spectral) sous
(licence OFL-1.1).

Le détail du processus est lisible sur [le dépôt du portfolio](https://github.com/JMaxant/portfolio/blob/main/docs/fonts.md),
mais dans les grandes lignes, il s'agit de :

1. Récupérer les sources sur le dépôt Spectral (les masters UFO et le `.designspace`)
2. Adapter les sources (notamment en ajoutant une table de correspondance pour les graisses)
3. Utiliser python/`fontmake -o variable` et `fonttools` pour compiler une police variable par style
4. Et voilà ! Une police variable

## Faire du ménage

À ce stade, la réduction de poids n'est pas très visible, mais c'est là que les choses deviennent intéressantes.

Si on se penche sur le style du site, on se rend compte que :

1. Seules les graisses 300/400/600 sont utilisées
2. Seul le jeu de glyphes romain est pertinent (bien que j'aimerais, par exemple, parler grec, arménien ou ukrainien)

En utilisant

- `fonttools varLib.instancer`, on peut restreindre la graisse sur la plage qui nous intéresse (de 300 à 600)
- `fonttools subset` permet de réduire aux glyphes utiles (Latin, Latin-1, Latin étendu A/B, ponctuation et `€`)

Ces deux modifications appliquées, on passe de 6 fichiers (3 graisses x 2 styles, environ 532 Ko) à deux fichiers de 64
Ko environ (un par style, soit 125 Ko). À peu près 4 fois plus légers.

## T'as fait tout ça tout seul ?!?

**Absolument pas**.

L'essentiel de cette tâche a été réalisée avec Claude Code (probablement Sonnet ou Opus), et mon rôle a été celui de
spécificateur/inspecteur des travaux finis.

Claude a d'ailleurs son petit mot à dire sur quelques subtilités techniques :

### Trois bugs de compilation qui ne se voient qu'à l'usage

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

### Deux fichiers, pas un

Une police variable peut en théorie combiner plusieurs axes — graisse _et_ italique
dans un seul fichier, avec un axe `ital`. Les sources de Spectral n'en ont pas :
chaque `.designspace` ne porte qu'un axe `wght`. Fusionner romain et italique
demanderait de retravailler les sources UFO elles-mêmes pour leur ajouter un axe —
un travail de conception de police, pas de compilation, et fragile à maintenir face
aux mises à jour amont. Deux fichiers restent le plancher réaliste ici, contre six
avant.

### Licence : pas de renommage nécessaire

Le nom d'une police modifiée ne doit être changé, sous OFL, que si la licence
originale déclare un _Reserved Font Name_ — pas systématiquement à chaque
modification. [`assets/styles/fonts/OFL.txt`](https://github.com/JMaxant/portfolio/blob/main/assets/styles/fonts/OFL.txt) n'en déclare aucun : rien ne suit la
ligne de copyright, et "Spectral" n'apparaît nulle part ailleurs dans le texte de
licence. Cette compilation reste une "Modified Version" au sens de l'OFL (reconstruite
depuis les sources, axe remappé, glyphes normalisés et sous-ensemble), mais conserve
légitimement le nom "Spectral" — dans les métadonnées internes de la police comme
dans `--font-serif`.

## Tout ça pour ça ?

Hé bien oui, **tout ça pour ça**. C'était un sous-projet dans le projet qui s'est révélé être une très bonne surprise.
L'utilisation de l'IA a été déterminante dans ce cas, car si j'aurais probablement fini par m'en sortir, ça m'aurait
pris plusieurs jours, voire semaines, contre à peine une heure. La gratification immédiate, c'est de voir les voyants Lighthouse
passer au vert, mais le vrai intérêt, surtout dès lors qu'on parle d'écoconception, c'est l'impact vertueux concret sur
chacune des requêtes du site (qui a, bien entendu, des millions de visites uniques quotidiennes).
Peut-être un jour tenterai-je d'industrialiser tout ceci, que ce soit autre chose qu'un processus décrit dans un dépôt
de niche ? En attendant, je ne me lasse pas de voir les feux d'artifice dans Lighthouse (car, encore une fois, j'ai des
plaisirs simples).
