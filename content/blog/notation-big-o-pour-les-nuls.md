+++
date = '2026-09-23'
draft = false
title = 'La notation Big O pour les nuls'
description = "Comment lire O(n), O(log n) ou O(n²) sans y voir des maths — et pourquoi ça compte avant même d'avoir un problème de performance."
tags = ['algorithmique', 'go']
translationKey = 'notation-big-o-pour-les-nuls'
cover = ''
+++

La notation Big O répond à une seule question : **si je donne deux fois plus de
données à ce code, il met combien de fois plus de temps ?** Pas "combien de
millisecondes" — ça dépend de la machine, du langage, du cache. Big O ignore tout ça
pour ne garder que la tendance : est-ce que le temps double, est-ce qu'il est
multiplié par quatre, ou est-ce qu'il ne bouge presque pas ?

## Ce que "O(...)" veut dire

`O(f(n))` se lit "l'ordre de grandeur du temps suit `f(n)`", où `n` est la taille de
l'entrée (le nombre d'éléments d'une liste, de lignes d'une table...). Ce qui compte
n'est jamais la constante devant, ni les termes qui deviennent négligeables quand `n`
grossit — seul le terme qui domine survit :

* `3n + 100` devient `O(n)` — le `+100` ne pèse plus rien dès que `n` est grand, et le
  `3` ne change pas la *forme* de la courbe, seulement sa pente.
* `n² + n` devient `O(n²)` — le `n²` écrase le `n` dès que `n` dépasse quelques
  unités.

C'est une notation de *comportement à grande échelle*, pas une mesure de vitesse
réelle.

## Les complexités qu'on croise tout le temps

| Notation     | Nom            | Exemple concret                                                                                        |
|--------------|----------------|--------------------------------------------------------------------------------------------------------|
| `O(1)`       | Constant       | Lire `slice[3]` — un accès par index, quelle que soit la taille du slice                               |
| `O(log n)`   | Logarithmique  | Chercher un mot dans un dictionnaire papier : à chaque étape, on élimine la moitié des pages restantes |
| `O(n)`       | Linéaire       | Parcourir une liste une fois pour trouver un élément                                                   |
| `O(n log n)` | Quasi-linéaire | Trier une liste avec un bon algorithme de tri (tri fusion, tri rapide en moyenne)                      |
| `O(n²)`      | Quadratique    | Comparer chaque élément d'une liste à tous les autres (deux boucles imbriquées)                        |
| `O(2^n)`     | Exponentiel    | Essayer toutes les combinaisons possibles d'un ensemble de `n` éléments                                |

Le classement va du meilleur au pire dans cet ordre. Un algorithme `O(log n)` sur un
million d'éléments fait environ 20 comparaisons. Un algorithme `O(n²)` sur le même
volume en fait mille milliards.

## Un exemple qui se voit dans le code

Chercher une valeur dans une liste triée, la manière naïve (parcourir un par un) :

```go
func rechercheLineaire(valeurs []int, cible int) bool {
    for _, v := range valeurs {
        if v == cible {
            return true
        }
    }
    return false
}
```

C'est `O(n)` : dans le pire cas (la valeur n'existe pas, ou elle est en dernière
position), on parcourt toute la liste.

Comme la liste est triée, on peut faire mieux — éliminer la moitié des candidats à
chaque comparaison plutôt que d'avancer un par un :

```go
func rechercheDichotomique(valeurs []int, cible int) bool {
    debut, fin := 0, len(valeurs)-1
    for debut <= fin {
        milieu := (debut + fin) / 2
        switch {
        case valeurs[milieu] == cible:
            return true
        case valeurs[milieu] < cible:
            debut = milieu + 1
        default:
            fin = milieu - 1
        }
    }
    return false
}
```

C'est `O(log n)`. Sur une liste de 1 000 éléments, la première version fait jusqu'à
1 000 comparaisons ; la seconde, 10 au maximum. L'écart ne vient d'aucune astuce
d'implémentation — juste du fait qu'on jette la moitié des données restantes à chaque
tour, au lieu d'une seule.

## Ce que ça n'est pas

* **Une mesure de temps réel.** Un `O(n²)` peut battre un `O(n log n)` si `n` reste
  petit — la notation ne dit rien sur les constantes, seulement sur ce qui se passe
  quand `n` devient grand.
* **Une excuse pour optimiser prématurément.** Un algorithme `O(n²)` sur une liste de
  20 éléments qui ne grossira jamais n'a aucun problème à résoudre. Le sujet devient
  réel quand `n` peut croître sans qu'on contrôle sa limite (les lignes d'une table,
  les utilisateurs d'un service).
* **Réservé aux entretiens techniques.** Ça sert surtout à répondre à une question
  très concrète en amont : cette fonction va-t-elle tenir quand le volume de données
  sera multiplié par dix ?
