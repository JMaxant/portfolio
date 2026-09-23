+++
date = '2026-05-15'
draft = false
title = "Mise en place d'une navigation multi-audience pour un site institutionnel"
description = 'Étude de cas : cadrer un besoin éditorial multi-audience en un système de navigation et classification unique, sans multiplier menus ni taxonomies.'
tags = ['drupal', 'php']
translationKey = 'navigation-multi-audience'
status = 'terminé'
repo = ''
demo = ''
role = 'Lead developer'
featured = true
+++

## Contexte

* Refonte de site institutionnel
* Drupal 10+ (10.3.x à sa mise en ligne)
* Site multilingue
* Important traffic international (notamment saisonnier), allant jusqu'à 15 000 visites uniques quotidiennes

Les contenus du site sont structurés en trois espaces distincts par public cible :

* grand public (B2C)
* professionnels (B2B)
* relations publiques (PR)

Dans chacune de ces sections, les gabarits et comportements des types contenus sont partagés, il n'est donc ni pertinent ni requis de créer des types de contenus dédiés.

Les éléments de navigation du site (menu principal et breadcrumb) doivent refléter cette organisation, c'est-à-dire que l'élément "Accueil" du breadcrumb doit renvoyer vers la page d'accueil de la section.

Le besoin éditorial, formulé simplement : permettre au contributeur de rattacher chaque contenu à l'une des trois sections, pour que :

* le fil d'Ariane affiche la bonne page d'accueil de rattachement ;
* le menu du header reflète l'espace courant.

## Les contraintes

* Un menu de header en deux temps : un premier bloc pour naviguer entre les trois espaces, un second pour les rubriques de l'espace courant. Entre ces deux menus, des éléments statiques s'intercalent, cassant le flux du rendu et compromettant l'intégration du menu. Le rendu du menu ne peut donc pas se reposer sur le rendu natif de Drupal et impliquerait une préparation en amont de l'affichage (`hook_preprocess`, duplication de blocks ou manipulation en javascript)
* Une classification de contenu à gérer sur chaque page pour piloter ces deux menus et le fil d'Ariane
* Un besoin de simplification de la contribution
* Côté technique, un choix délibéré de limiter autant que possible le recours aux hooks
* Cette notion doit aussi s'appliquer sur des pages techniques (Views, page de terme de taxonomie ou `Controller`)

L'approche la plus directe — une taxonomie dédiée en parallèle du menu, ou un menu par espace — revenait à maintenir deux structures pour une seule idée (l'appartenance à un espace), avec le risque classique de désynchronisation entre les deux au fil des évolutions.

## Les choix écartés

* Un menu par section : multiplication du coût en maintenance et impact possible de performance (×3), requiert des hooks preprocess pour gérer l'élément actif du menu des landing pages de sections.
* Catégorisation par vocabulaire de taxonomie : deux sources de vérité alimentées manuellement (menu et termes de taxonomie), avec le risque de désynchronisation

## Décisions techniques

Chaque contenu porte un champ optionnel qui référence l'un des trois éléments racine du menu principal (basé sur le plugin_id du `MenuLinkTreeElement`).
Laissé vide, il prend pour valeur par défaut, par ordre de priorité :

1. Son élément parent, s'il est présent dans le menu
2. La page d'accueil générale

Cette valeur est calculée dans un `ContextProvider`, qui l'expose dans les blocks de menu. Deux blocks sont déclarés, tous deux basés sur le menu principal :

* Le menu des sections (B2C, B2B, PR)
* La navigation dans les enfants (niveau 1 et plus)

Le `ContextProvider` devient la source de vérité unique de la section active et permet de piloter l'affichage et le rendu des différents éléments via une couche d'abstraction rendant cette valeur accessible à l'ensemble du site, pas seulement les nodes.

À partir de cette valeur :

* le fil d'Ariane utilise la landing page correspondante comme racine, plutôt que systématiquement `/` ;
* le premier bloc du menu header affiche les liens vers les deux autres espaces (ex. dans l'espace B2B, il pointe vers B2C et PR) ;
* le second bloc affiche les enfants de l'élément racine de l'espace courant.

Le rendu dépend de cette valeur, pas de la route ni de l'utilisateur connecté — les contextes de cache natifs de Drupal (route, utilisateur, langue...) n'en savent rien. Deux conséquences concrètes sans contexte dédié :

* le filtrage du menu (accès autorisé ou refusé par élément selon l'espace, via `AccessResult`) n'est associé à aucun contexte de cache existant : Drupal peut resservir un menu déjà filtré pour le mauvais espace ;
* changer l'espace d'un contenu produit deux jeux de contextes de cache, avant et après, sans rien en commun aux yeux de Drupal — qui lève une erreur de redirection de cache.

Le cache context personnalisé règle les deux en rendant l'espace explicite dans la clé de cache.

Un seul point de vérité (le `ContextProvider`), pas de taxonomie parallèle à synchroniser.

## Résultat

En production, sans retour depuis la mise en ligne, sur un site à ~13 000 visites/jour. La classification est prise en main par les équipes éditoriales sans formation particulière — un seul champ à renseigner, dont le sens (quel espace) leur est déjà familier puisqu'il reprend directement la structure du menu qu'elles connaissent.
