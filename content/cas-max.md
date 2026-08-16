+++
date = '2026-08-09'
draft = true
title = 'Cas max'
description = 'Page de recette : exerce tous les éléments qu’un fichier Markdown peut produire dans un article, pour vérifier le rythme vertical et les colonnes de la grille.'

[build]
list = 'never'
+++

Ce paragraphe ouvre le corps de l'article, juste après le filet du `header`. Il sert
à mesurer l'espace entre l'en-tête et le premier bloc, puis l'espace entre deux
paragraphes.

Deuxième paragraphe, collé au précédent par le pas de base du rythme. Il contient du
`code en ligne`, du texte **en gras**, de l'*italique*, du ~~texte barré~~ et un
[lien](/blog/) pour vérifier qu'aucun de ces éléments ne casse la ligne de base.

## Titre de niveau 2

Paragraphe qui suit immédiatement un titre de niveau 2 : il doit être plus proche de
son titre que de son voisin, c'est ce couplage que le rythme conserve.

### Titre de niveau 3

Paragraphe sous un titre de niveau 3, couplage plus serré encore.

#### Titre de niveau 4

Paragraphe sous un titre de niveau 4, le couplage le plus serré de l'échelle.

##### Titre de niveau 5

Paragraphe sous un titre de niveau 5 : seul `overflow-wrap` du reset le touche
actuellement, ni taille ni marge propres.

###### Titre de niveau 6

Paragraphe sous un titre de niveau 6, même défaut que le niveau 5.

## Titres consécutifs

### Titre de niveau 3 collé à son titre de niveau 2

#### Titre de niveau 4 collé à son titre de niveau 3

Cas limite du modèle de rythme : les deux titres ci-dessus suivent directement celui qui
les précède, sans paragraphe entre eux. Deux règles de même spécificité revendiquent le
`h3` ; c'est l'ordre source qui tranche, et l'air au-dessus du titre doit l'emporter sur
le resserrement qui suit un `h2`.

## Listes

Une liste à puces, séparée du paragraphe qui la précède comme n'importe quel bloc :

- Premier élément, court.
- Deuxième élément, plus long, qui court sur plusieurs lignes pour vérifier que
  l'indentation de la puce reste bien à l'intérieur de la colonne de contenu et ne
  déborde pas de la mesure de lecture.
- Troisième élément, avec une sous-liste :
  - Élément imbriqué.
  - Autre élément imbriqué, dont le `p` implicite ne doit pas hériter du rythme des
    enfants directs de l'article.

Une liste numérotée :

1. Première étape.
2. Deuxième étape.
3. Troisième étape.

Une liste de tâches, extension `tasklist` : la puce et la case à cocher cohabitent sur
le même `li`.

- [x] Tâche terminée.
- [ ] Tâche restante, sur une ligne assez longue pour vérifier que le texte s'aligne
      bien sous lui-même et non sous la case.
- [ ] Autre tâche restante.

Une liste de définitions, extension `definitionlist` :

Terme simple
: Une seule définition pour ce terme.

Terme à plusieurs définitions
: Première définition.
: Seconde définition, pour vérifier l'empilement de plusieurs `dd` sous un même `dt`.

## Emphases imbriquées

Un paragraphe qui imbrique les emphases : **gras contenant de l'*italique imbriqué***,
*italique contenant du **gras imbriqué***, et ~~texte barré contenant du **gras**~~,
pour vérifier que chaque niveau reste visuellement distinct de son parent.

## Image en prose

L'image suivante n'a pas de légende ni de `figure` — Goldmark ne fournit pas ce
render hook par défaut. Seul le reset s'applique (`display: block; max-width: 100%`) :

![Rectangle de test, sans légende](/cas-max/placeholder.svg)

## Notes de bas de page

Un paragraphe avec un appel de note[^premiere] et un second appel plus loin dans la
même phrase, pour vérifier l'espacement entre deux `sup` consécutifs[^seconde].

[^premiere]: Première note, courte.
[^seconde]: Seconde note, plus longue, pour vérifier que le retour à la ligne dans la
    liste des notes de bas de page reste lisible et que le lien de retour (`↩`) ne se
    retrouve pas isolé sur sa propre ligne.

## Citation

Le bloc qui suit n'avait aucune marge avant le passage en grille : il était collé au
paragraphe suivant.

> Une citation sur un seul paragraphe, avec son filet à gauche et son fond.
>
> Un deuxième paragraphe dans la même citation, pour vérifier l'empilement des marges
> internes contre le `padding` du bloc.

Paragraphe qui suit la citation : c'est ici que le trou se voyait.

## Tableau

Le tableau a ses bordures et son en-tête, mais pas encore de colonne `wide`/`full` —
cette part de #78 reste liée au ticket grid et à son débordement sur mobile.

| Token             | Valeur   | Rôle                                                      |
|-------------------|----------|-----------------------------------------------------------|
| `--spacing-xs`    | 0.8rem   | Couplage titre de niveau 4 vers son texte                 |
| `--spacing-sm`    | 1.2rem   | Couplage titre de niveau 3 vers son texte                 |
| `--spacing-md`    | 1.6rem   | Couplage titre de niveau 2 vers son texte, et gouttière   |
| `--spacing-lg`    | 2.4rem   | Pas de base du rythme vertical                            |
| `--spacing-xl`    | 4rem     | Air au-dessus d'un titre de niveau 3                      |
| `--spacing-2xl`   | 6.4rem   | Débordement maximal d'une piste `wide`                    |

## Séparateur

Le `hr` qui suit se resserre et se centre sous 560px.

---

Paragraphe après le séparateur.

## Bloc de code

Le bloc qui suit est placé dans la colonne `wide` : il dépasse la mesure de lecture
jusqu'à `--spacing-2xl` de chaque côté, et se resserre de lui-même quand la place
manque. La ligne longue reste couverte par `overflow-x` sur le `pre`.

```go
func handler(w http.ResponseWriter, r *http.Request) {
 // Une ligne délibérément trop longue pour la mesure de lecture, afin de vérifier que le pre reste bien l'élément qui défile et qu'il garde le focus clavier.
 if err := json.NewEncoder(w).Encode(map[string]string{"statut": "ok"}); err != nil {
  http.Error(w, err.Error(), http.StatusInternalServerError)
 }
}
```

Une fence sans langage, qui ne passe pas par Chroma et n'a donc pas de classe
`.chroma` :

```text
$ hugo --cleanDestinationDir
Total in 142 ms
```

## Appel à l'action

Le bouton qui suit est seul sur sa ligne : Hugo ne l'enveloppe pas dans un
paragraphe, il devient donc un enfant direct de l'article et un item de grille. Il
doit garder sa largeur intrinsèque au lieu de s'étirer sur toute la mesure.

{{< cta url="/blog/" label="Lire le blog" >}}

## Mot insécable

Le paragraphe suivant contient une chaîne de 400 caractères sans espace. Elle doit
déborder de sa propre boîte sans élargir la page ni faire apparaître de barre de
défilement horizontale sur le `body` :

a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8a1b2c3d4e5f6g7h8

Dernier paragraphe de la page, pour mesurer le blanc de fin contre le `padding` bas de
l'article.
