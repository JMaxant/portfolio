+++
date = '2026-09-23'
draft = true
title = 'La notation Big O pour les nuls'
description = "Comment lire O(n), O(log n) ou O(n²) sans y voir des maths — et pourquoi ça compte avant même d'avoir un problème de performance."
tags = ['Algorithmique', 'Go']
translationKey = 'notation-big-o-pour-les-nuls'
images = []
aiDisclaimer = 'Partiel (relecture et corrections)'
+++

La notation Big O, pour un profil comme le mien (j'entends par là, un profil reconverti ou dont la formation initiale
n'était pas orientée maths/informatique), c'est un sujet un peu mystérieux qu'on aperçoit sur des réponses Stack Overflow
ou des threads Reddit et face auquel on lève un sourcil et on prend l'air inspiré de la personne qui n'a pas vraiment
compris, mais préfère éviter que ce soit vu. _A posteriori_, je pense que ça se voit et que la plupart d'entre nous ne
comprennent pas forcément beaucoup plus ce dont il s'agit (un peu comme les regex).

Je me suis donc lancé (à corps perdu, rien de moins) dans le sujet pour pouvoir moi aussi briller en société et laisser
des commentaires de revue de code abscons.

## Que sont les "O(...)"

Pour résumer rapidement, cette notation décrit comment le temps d'exécution évolue lorsque la quantité de données (`n`)
évolue.

| Notation   | Nom            | Exemples (Go, PHP)                      | Si n double…        |
|------------|----------------|-----------------------------------------|---------------------|
| O(1)       | Constant       | `nombres[0]`, `$tableau[0]`             | Temps identique     |
| O(log n)   | Logarithmique  | `slices.BinarySearch()`                 | +1 étape            |
| O(n)       | Linéaire       | `for range`, `foreach`, `in_array()`    | Temps × 2           |
| O(n log n) | Quasi-linéaire | `slices.Sort()`, `sort()`, `usort()`    | Un peu plus que × 2 |
| O(n²)      | Quadratique    | Deux `for range` ou `foreach` imbriqués | Temps × 4           |
| O(n³)      | Cubique        | Trois `for` ou `foreach` imbriqués      | Temps × 8           |
| O(2ⁿ)      | Exponentiel    | Fibonacci récursif naïf                 | Temps au carré      |

Si ça vous éclaire : bravo ! Vous êtes bien plus intelligent.e.s que moi, sinon, pas de panique, des explications
arrivent.

## Approfondissons (avec des exemples !)

Ce que cette notation (et ce tableau) permet, c'est d'anticiper comment se comportera un algorithme selon la quantité
de données (`n`).

Les exemples qui suivent prendront des valeurs arbitraires pour la facilité de lecture : on partira du principe que
l'opération coûtera 1ms (quelle qu'elle soit).

### `O(1)`

```go
// nombres contient un élément
nombres[0] // 1ms

// nombres contient 1 000 éléments
nombres[0] // 1ms
```

Le temps d'exécution est **constant** : on récupère un élément dans le tableau, et c'est tout.

### `O(log n)`

```go
// nombres contient 1 000 éléments triés
slices.BinarySearch(nombres, 42) // ~10ms

// nombres contient 1 000 000 éléments triés
slices.BinarySearch(nombres, 42) // ~20ms
```

Bien que la quantité de données soit 1000 fois plus importante dans le second cas, le temps d'exécution est seulement
multiplié par 2 : c'est le principe de la recherche binaire.

Prenez `git bisect` (commande git qui mérite éloges et offrandes quotidiennes) : on lui donne un point de départ (`git bisect good`, traduisible par "à ce moment, la prod marchait encore"), un point d'arrivée (`git bisect bad`, ou "c'est là que la prod a pris feu"), et à partir de là, il va se mettre au milieu de l'intervalle (`n`). À chaque itération, on teste, on définit si c'est bon ou non, ce qui permet de déduire "la bonne" moitié, et il recommence à partir de la bonne moitié pour éliminer par dichotomie jusqu'à arriver au point de bascule (le commit en cause).

Concrètement, ça veut dire qu'au lieu de tester _chacun_ des commits (soit `n`), on aura dans le pire des cas 10 ou 20 opérations (au lieu de 1 000 ou 1 000 000).

### `O(n)`

```go
// nombres contient 1 000 éléments
for _, v := range nombres {
 total += v
} // 1 000ms

// nombres contient 1 000 000 éléments
for _, v := range nombres {
 total += v
} // 1 000 000ms
```

Ici, c'est explicite, le coût croît **linéairement** : le coût d'exécution sera de `n` ms.

### `O(n log n)`

```go
// nombres contient 1 000 éléments
slices.Sort(nombres) // ~10 000ms, soit 10s

// nombres contient 1 000 000 éléments
slices.Sort(nombres) // ~20 000 000ms, soit ~5h30
```

Celui-ci est un peu abstrait, car, que ce soit en PHP ou en Go, les algorithmes de tri (`sort` en php) fonctionnent sous le capot en `O(n log n)`, c'est la complexité des bons algorithmes de tri (comme le tri fusion). Dans notre cas, ce qu'il faut garder en tête, c'est que le `log` grandit lentement : la différence entre un tri `O(n log n)` et un tri `O(n²)` sur 1 000 000 d'éléments, c'est la différence entre 5h30 et 32 ans.

### `O(n²)`

```go
// nombres contient 1 000 éléments
for i := range nombres {
 for j := range nombres {
  // comparer nombres[i] et nombres[j]
 }
} // 1 000 000ms, soit ~17min

// nombres contient 1 000 000 éléments
// 1 000 000 000 000ms, soit ~32 ans
```

L'exemple ci-dessus est naïf (et encore une fois il s'agit de donner un ordre d'idée), mais c'est le cas typique qui fonctionne _jusqu'à un certain point_ : une tâche de fond qui compare des contenus ou des entités et qui tourne sans problème, mais où l'opération appliquée voit son coût augmenté de `2n` pour chaque nouvelle entité. Si on double le nombre d'entités, le temps d'exécution quadruple.

### `O(n³)`

```go
// nombres contient 100 éléments
for i := range nombres {
 for j := range nombres {
  for k := range nombres {
   // ...
  }
 }
} // 1 000 000ms, soit ~17min

// nombres contient 1 000 éléments
// 1 000 000 000ms, soit ~11 jours et demi
```

Dans ce cas, si on double le nombre d'entités, le temps d'exécution est multiplié par huit.

### `O(2ⁿ)`

```go
func fib(n int) int {
 if n < 2 {
  return n
 }
 return fib(n-1) + fib(n-2)
}

fib(1) // 1ms
fib(10) // ~1 000ms, soit ~1s
fib(11) // ~2 000ms, soit ~2s
fib(12) // ~4 000ms, soit ~4s
fib(30) // ~1 000 000 000ms, soit ~12 jours
```

Dans cet exemple, `n` n'est plus un tableau, mais un entier arbitraire. Le principe s'applique quand même : chaque incrémentation **double le temps d'exécution** (d'où `2ⁿ` soit `2 ^ 10`, puis `2 ^ 11` etc).

## Et ça sert à quoi ?

Déjà, ça ne sert pas _au quotidien_.

Quitte à évaluer les complexités rencontrées, au quotidien, on sera plus souvent confrontés à des complexités de tout autre ordre (NPath, cyclomatique par exemple) et qui seront bien plus contraignantes ou dangereuses sur le long terme ou dans la vie du projet car elles sous-entendent des problèmes de compréhension et de maintenance du code.

Il y a aussi le non-dit, qui est que dans bien des cas cette grille d'analyse sera peu pertinente : comme pour nos amis les IA, le contexte est tout. Sur une volumétrie limitée par exemple, c'est une analyse qui n'apportera rien.

En revanche, c'est un outil d'anticipation et d'architecture de son code : avoir tout ça en tête, c'est pouvoir se poser la question "Comment mon code se comportera quand il sera alimenté par `n` fois plus de données ?". Et c'est aussi un raccourci et un vocabulaire commun plus précis, à défaut d'être plus intelligible, pour mieux répondre ou mieux review le code.

Et pour ce qui est de briller en société : honnêtement, bof. Mais ça m'aura au moins permis d'écrire cet article, donc c'est toujours ça de pris (je garde les regex sous le coude).
