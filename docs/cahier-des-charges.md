# Cahier des charges — Portfolio Julien Maxant

Statut : brouillon de travail — sert de fil rouge pendant le développement, à amender au fur et à mesure.

## 1. Contexte

- Site : `https://www.julien-maxant.com/`
- Stack imposée : Hugo, thème [bear-cub](https://github.com/clente/hugo-bearcub), gestion de tâches via `Taskfile.yml`.
- Le site est actuellement un squelette (thème installé, contenu en Lorem Ipsum, une seule page `content/_index.md`).
- Volonté explicite : coder le site soi-même pour monter en compétence sur la stack (Hugo, templating Go, CSS, CI/CD). Ce document cadre le *besoin*, pas l'implémentation.

## 2. Objectifs du site

Par ordre de priorité déclaré :

1. **Vitrine professionnelle** — rassurer un recruteur ou un client freelance sur le sérieux et les compétences.
2. **Recherche d'opportunités** — emploi salarié et/ou missions freelance.
3. **Blog technique** — asseoir une présence durable, partager des retours d'expérience.
4. **Showcase de projets personnels** — side-projects, sans objectif commercial direct.

Le site sert aussi de terrain d'entraînement technique, mais ce n'est pas un objectif *utilisateur* — ne pas sacrifier la lisibilité du contenu à la démonstration technique.

## 3. Cible

**Cible principale : recruteurs et clients professionnels.**

Conséquences sur le ton et le contenu :
- Ton clair, professionnel, orienté preuve (résultats, stack, contexte) plutôt qu'informel.
- Les articles de blog technique doivent rester accessibles à un lecteur qui évalue un profil (pas seulement à des pairs devs) — éviter le jargon non expliqué en première lecture.
- Le CV/parcours doit être facile à scanner en quelques secondes (recruteur pressé).

## 4. Contenu prioritaire

Trois piliers de contenu à couvrir, par ordre de priorité :

1. **Projets / réalisations** — fiches avec études de cas : contexte, problème, stack utilisée, décisions techniques, résultat/impact. Ne pas se limiter à une liste de liens GitHub.
2. **Blog technique** — articles de fond, retours d'expérience, veille. Cadence non définie à ce stade (à fixer : ex. 1 article/mois pour rester réaliste).
3. **CV / parcours** — timeline d'expérience professionnelle, formations, compétences. Doit pouvoir être lu indépendamment du reste (page dédiée ou section clairement identifiable).

## 5. Arborescence proposée

À valider/ajuster en codant, mais comme point de départ cohérent avec les priorités ci-dessus :

```
/                     → page d'accueil : accroche, résumé du profil, mise en avant
                        de 2-3 projets phares, dernier(s) article(s) de blog, CTA contact
/projets/             → liste des réalisations
/projets/<slug>/      → étude de cas détaillée par projet
/parcours/            → CV / timeline d'expérience + formations + compétences
/blog/                → liste des articles
/blog/<slug>/         → article
/contact/ (ou ancre)  → coordonnées / liens
```

**Décidé** : le CV est une page HTML native (`/parcours/`), pas un PDF téléchargeable. Plus facile à faire évoluer qu'un PDF réexporté à chaque mise à jour, et cohérent avec un contenu géré en Markdown comme le reste du site.

## 5bis. Structure de la page Parcours / CV

Contrainte exprimée : rester épuré, en distinguant au moins deux temps liés à la reconversion de 2017.

Structure proposée :

1. **Chapeau** — une phrase de positionnement (qui je suis, ce que je fais aujourd'hui).
2. **"Maintenant" (2017 → aujourd'hui)** — parcours dev : postes, stack utilisée (PHP/Drupal/Symfony/JS/Vue), réalisations clés. C'est la section qui doit peser le plus, en ordre antichronologique.
3. **"Avant" (jusqu'à 2017)** — condensé, un paragraphe ou une timeline courte. Mentionner la reconversion sans la détailler à l'excès : elle est intéressante comme histoire, pas comme argument technique.
4. **Compétences, avec deux niveaux clairement distingués** :
   - *Stack quotidienne* : PHP, Drupal, Symfony, JS, Vue — ce que tu pratiques en conditions réelles.
   - *Direction / en cours d'acquisition* : Go, Python, Kubernetes — présenté explicitement comme une trajectoire, pas comme une compétence acquise. Évite le sur-claim tout en assumant l'ambition.

Point clé : ne pas laisser la section 4 comme une simple déclaration d'intention. Relier chaque compétence "en cours d'acquisition" à une preuve concrète ailleurs sur le site (article de blog documentant un apprentissage Go, side-project Python/K8s dans `/projets/`) — ça transforme une ambition affichée en trajectoire démontrable. Implique de prévoir un tag ou une catégorie commune (ex. `apprentissage`, `go`, `k8s`) pour que ces contenus soient facilement regroupables.

## 5ter. Page d'accueil : sections dynamiques

Deux idées évoquées : "Récemment publiés" (nouveau contenu) et "Dernières mises à jour" (contenu existant retouché) — ce sont deux signaux réellement différents, mais avec le faible volume de contenu au lancement, les séparer en deux sections risque de laisser l'une des deux vide ou anecdotique.

**Recommandation V1** : une seule section unifiée (ex. "Dernières activités"), qui mélange nouveaux articles de blog et mises à jour notables (nouvelle étude de cas, refonte d'un projet), triée par date la plus récente. À scinder en deux sections distinctes plus tard, une fois que chaque flux a assez de volume pour être lisible indépendamment (ordre de grandeur : quelques articles ET un historique de mises à jour de projets qui vaille la peine d'être tracé séparément).

## 5quater. Modèles de contenu (archetypes Hugo)

Utile uniquement pour les types de contenu créés de façon répétée — pas pour les pages singulières.

- **`blog`** — archetype dédié : `title`, `date`, `draft`, `tags`, `description`, éventuellement `cover`.
- **`projets`** — archetype dédié : `title`, `date`, `tags` (liste), `role`, `repo`/`demo` (liens), `status` (en cours / terminé), `description`.
- **Accueil, Parcours, À propos** — pas d'archetype nécessaire : pages uniques, créées une fois, éditées directement.

Les archétypes `archetypes/default.md` (générique), `archetypes/blog.md` et `archetypes/projets.md` existent.

## 5quinquies. Taxonomies & filtrage des listes

~~**Décidé** : prévoir une taxonomie par **stack technique** (ex. `php`, `symfony`, `vue`, `go`, `python`, `k8s`), appliquée aux articles de blog et aux fiches projets. Sert à la fois de mécanisme de découverte pour le visiteur et de fil conducteur pour la trajectoire "avant/maintenant/direction" décrite en 5bis.~~

~~Point à trancher : nommer une taxonomie dédiée (ex. `stack`) plutôt que de tout entasser dans `tags` — plus propre pour distinguer "techno utilisée" d'autres classifications futures (ex. type de contenu, thématique).~~

Ne sera utilisée qu'une seule taxonomie (tags), une deuxième taxonomie sera ajoutée si besoin mais excessive à date.

**Recherche/filtrage sur les pages de liste** (blog et projets) : évoqué comme un "peut-être", pas encore un engagement ferme. Deux niveaux possibles :
1. **Pages de taxonomie natives Hugo** (`/tags/go/`, etc.) — générées automatiquement à la compilation, zéro JS, zéro coût de maintenance. Bonne base minimale, quasiment gratuite avec une taxonomie déjà en place.
2. **Filtre interactif côté client** sur une page de liste (cocher une techno, la liste se met à jour sans rechargement) — nécessite du JS (site 100% statique, pas de traitement serveur), faisable en vanilla JS à cette échelle mais c'est un vrai morceau de dev, pas juste de la config.

Le niveau 1 est à considérer comme acquis dès qu'une taxonomie existe. Le niveau 2 reste un point ouvert (voir section 14).

## 6. Identité visuelle

- Choix affirmé : pas de branding fort (pas de logo prévu), focus sur le contenu — mais **personnalisation prévue**, notamment un switch clair/sombre (light/dark mode).
- Contrainte du thème bear-cub : `assets/styles/01-base.css` existe déjà et laisse penser qu'une architecture de surcharge CSS est en cours de mise en place. Le thème fournit plusieurs feuilles de style alternatives (`original.css`, `herman.css` — cette dernière étant une variante sombre fixe), mais **pas de bascule clair/sombre au runtime** : c'est un choix de style statique à la compilation, pas un toggle utilisateur. Le switch light/dark devra donc être développé (détection `prefers-color-scheme` + bascule manuelle mémorisée, typiquement via `localStorage`), pas récupéré tel quel du thème.

## 7. Internationalisation

- **Phase 1 : FR uniquement.** Contenu, URLs et méta en français (`locale = fr-fr` déjà en place).
- **Phase 2 (plus tard) : ajout de l'anglais.** Ne pas fermer la porte techniquement :
  - Éviter de coder en dur des liens ou labels qui supposeraient une seule langue.
  - Garder à l'esprit que chaque contenu (page, article) devra un jour exister en FR *et* EN de façon complète (pas de traduction partielle) — c'est une contrainte à anticiper dans la structure de contenu (ex. `translationKey` par article), pas à implémenter maintenant.

**Pourquoi préparer la config dès maintenant plutôt que d'attendre** : le risque n'est pas le contenu (rajouter des traductions plus tard est un simple ajout), c'est l'**URL**. Si le mode multilingue Hugo est activé plus tard sans y avoir pensé, les URLs françaises actuelles peuvent se retrouver déplacées (`/blog/...` → `/fr/blog/...`), cassant les liens déjà partagés/indexés. Le fix est un réglage de config à poser dès le départ, sans traduire quoi que ce soit tout de suite :
  - `defaultContentLanguage = "fr"` et `defaultContentLanguageInSubdir = false` dans `hugo.toml` — le français reste à la racine (`/blog/...`), l'anglais arrivera plus tard sous `/en/...` sans rien déplacer.
  - Organiser le contenu en *page bundles* avec `translationKey` dès maintenant (même mono-langue) pour que l'ajout de l'anglais soit additif, pas une réorganisation.

Note technique annexe : le thème bear-cub embarque déjà des traductions d'interface (en/de/ko/pt/tr) mais pas de `fr` — et le dossier `i18n/` du site est actuellement vide. Les libellés d'interface (boutons, labels) du thème pourraient donc s'afficher dans une langue par défaut du thème plutôt qu'en français tant qu'un `i18n/fr.toml` ne surcharge pas ces clés. Détail d'implémentation à traiter en développant, sans impact sur le cadrage.

## 8. SEO & structure de données

Non demandé explicitement mais cohérent avec l'objectif "vitrine pro" — à considérer comme périmètre standard d'un portfolio sérieux :
- Meta description par page, OpenGraph pour le partage (LinkedIn notamment, vu la cible pro).
- JSON-LD `Person` a minima sur la page d'accueil/à propos (nom, métier, compétences) — cohérent avec un site personnel de marque.
- Sitemap et flux RSS pour le blog (souvent natifs à un thème Hugo comme bear-cub — à vérifier plutôt qu'à recréer).

## 8bis. GEO & accessibilité aux agents IA

Pertinent vu la cible (recruteurs/devs) et le positionnement "vitrine technique". Un site Hugo statique est déjà un bon point de départ : pas de rendu JS à franchir pour un crawler ou un agent, contrairement à une SPA.

À prévoir :
- **Structured data étendu** : au-delà du `Person` déjà prévu (section 8), ajouter `BlogPosting`/`Article` sur les billets de blog et `CreativeWork` (ou équivalent) sur les fiches projets — aide autant le SEO classique que les moteurs génératifs à identifier et citer correctement le contenu.
- **`robots.txt` permissif envers les crawlers IA connus** (GPTBot, ClaudeBot, PerplexityBot, Google-Extended...) — à l'inverse de beaucoup de sites corporate qui les bloquent, ici l'objectif est la visibilité, pas la protection.
- **`llms.txt`** — convention émergente et non standardisée (un résumé texte du site + liens clés, sur le modèle de `robots.txt`), adoption non garantie par les outils IA, mais coût d'ajout quasi nul. À considérer comme un plus, pas un prérequis.
- **Prose factuelle et bien structurée** (titres, listes, affirmations claires du type "j'ai construit X pour résoudre Y avec Z") — sert autant un recruteur qui scanne rapidement qu'un LLM qui résume/extrait le contenu. Cohérent avec le ton déjà décidé en section 3.
- **Décidé — prévu dès la V1** : `llms.txt` à la racine, et un CV machine-readable (format JSON Resume ou simple `/cv.json`) en complément de la page Parcours humaine.

## 9. Analytics

**Aucun analytics pour l'instant.** Ne rien intégrer par défaut.

## 10. Contact

Pas de formulaire de contact (pas de backend prévu). Les visiteurs doivent pouvoir :
- Écrire directement par **email** (lien `mailto:`).
- Accéder aux **profils LinkedIn et GitHub** (liens sortants, probablement en header/footer et sur la page d'accueil).

Pas de lien de prise de RDV (Cal.com/Calendly) à ce stade.

## 11. Hébergement / déploiement

**Non tranché.** Options à évaluer avant de coder la CI/CD :

| Option | Avantage principal | Point d'attention |
|---|---|---|
| GitHub Pages | Gratuit, Actions CI/CD simples, le repo est déjà sur GitHub | Pas de traitement serveur (formulaires, redirections avancées) |
| Cloudflare Pages | Bonne perf/CDN, extensible (edge functions) si besoin plus tard | Légèrement plus de configuration initiale |
| Netlify | Formulaires natifs sans backend | Moins pertinent ici puisqu'aucun formulaire n'est prévu |

Le nom de domaine (`julien-maxant.com`) est déjà défini dans `hugo.toml` — la décision d'hébergement doit rester compatible avec un domaine custom en HTTPS.

## 12. Hors périmètre (V1)

- Formulaire de contact avec backend.
- Prise de RDV en ligne.
- Analytics.
- Traduction anglaise complète.
- Design system élaboré / branding fort (logo, charte graphique poussée).

Ces points sont volontairement repoussés pour livrer une V1 sobre et rapide à mettre en ligne, puis itérer.

## 13. Definition of Done — V1

- [ ] Page d'accueil avec accroche, présentation, 2-3 projets phares, CTA contact.
- [ ] Section/page Projets avec au moins 1-2 études de cas complètes (pas de Lorem Ipsum).
- [ ] Page Parcours/CV à jour.
- [ ] Section Blog fonctionnelle (même avec 1 seul article de lancement).
- [ ] Liens email + LinkedIn + GitHub visibles et fonctionnels.
- [ ] Build Hugo sans warning, déployé en HTTPS sur `julien-maxant.com`.
- [ ] Aucun contenu Lorem Ipsum ou placeholder restant.
- [ ] Switch light/dark mode fonctionnel (préférence système détectée + bascule manuelle mémorisée).
- [ ] Taxonomie tag en place sur au moins les articles/projets publiés au lancement.
- [ ] `llms.txt` présent à la racine.
- [ ] CV machine-readable (`/cv.json` ou équivalent JSON Resume) présent et à jour avec la page Parcours.

## 14. Points ouverts à trancher pendant le développement

1. Cadence de publication du blog (pour rester réaliste sur l'engagement).
2. Choix définitif de l'hébergeur (GitHub Pages / Cloudflare / Netlify).
3. ~~Nom exact de la taxonomie stack technique (`stack` dédiée vs réutilisation de `tags`).~~ => Choix final: une seule taxonomie (tags).
4. Filtrage interactif (JS) sur les pages de liste blog/projets : en V1 ou repoussé en V1.1 — seules les pages de taxonomie natives Hugo sont acquises pour la V1 (section 5quinquies).

## 15. Découpage en tâches (ordre logique)

Séquencé par dépendances réelles, pas par numéro de section. Deux points ouverts (cadence de blog, filtrage interactif) ne bloquent aucune étape — ils sont repoussés à la fin ou hors V1.

### Phase 0 — Fondations de config (avant toute accumulation de contenu)

Tout changer ici après coup implique de retoucher du contenu déjà écrit — à faire en premier.

- [X] Trancher le nom de la taxonomie stack technique (point ouvert 3), la déclarer dans `hugo.toml`.
- [X] Config i18n-ready : `defaultContentLanguage = "fr"`, `defaultContentLanguageInSubdir = false` (section 7).
- [X] `i18n/fr.toml` pour surcharger les libellés du thème (section 7, note technique).
- [X] Archetypes `blog.md` et `projets.md` (section 5quater).
- [X] Quality checks + GitHub Actions dédiées (lint, build Hugo sans warning, vérification de liens) — automatise dès maintenant ce que la Phase 6 vérifiera manuellement une dernière fois avant mise en prod ; le pre-commit hook existant (si activé) doit rester cohérent avec ce que la CI vérifie.

### Phase 1 — Squelette de contenu (arborescence, sans rédaction ni design)

- [ ] Créer `/parcours/`, `/blog/`, `/projets/` (pages/listes, contenu encore vide ou stub).
- [ ] Vérifier que les layouts bear-cub (`single.html`/`list.html`) couvrent le type "projet" ; sinon prévoir un layout minimal dédié.
- [ ] Navigation : centraliser les menus dans `config/_default/menus.toml`, trancher le cas `/parcours/` (front matter vs config), déplacer le lien RSS de la nav vers le footer via surcharge des partials bear-cub (issue #36).

### Phase 2 — Identité visuelle

- [ ] Palette d'accent + typo minimale, appliquées via `assets/styles/01-base.css`.
- [ ] Switch light/dark : détection `prefers-color-scheme` + bascule manuelle mémorisée (`localStorage`) — développement complet, rien à récupérer du thème (section 6).

### Phase 3 — Contenu réel (remplace le Lorem Ipsum)

À ce stade la structure et le style existent déjà — on peut se concentrer sur le fond.

- [ ] Page Parcours : chapeau, "Maintenant", "Avant", compétences (stack quotidienne vs direction) — section 5bis.
- [ ] 1 à 2 études de cas projets, taguées avec la taxonomie stack.
- [ ] Premier article de blog — candidat naturel : documenter un apprentissage Go/Python/K8s, ce qui matérialise tout de suite le lien "preuve" de la section 5bis.
- [ ] Page d'accueil finale : accroche, projets phares, section "Dernières activités" (fusionnée, section 5ter), CTA contact.

### Phase 4 — SEO & GEO (une fois qu'il y a du contenu réel à décrire)

- [ ] Meta description + OpenGraph par page.
- [ ] JSON-LD : `Person` (accueil/à propos), `BlogPosting`/`Article` (articles), `CreativeWork` (projets).
- [ ] Vérifier sitemap + RSS natifs du thème plutôt que les recréer.
- [ ] `robots.txt` autorisant explicitement les crawlers IA connus (GPTBot, ClaudeBot, PerplexityBot, Google-Extended...).
- [ ] `llms.txt` — à écrire en dernier dans cette phase, une fois le contenu réel stabilisé (il le résume).
- [ ] CV machine-readable (`/cv.json`) — à générer après la page Parcours définitive, pour rester synchronisé.

### Phase 5 — Déploiement

- [ ] Trancher l'hébergeur (point ouvert 2) — aucune étape précédente n'en dépend, peut se décider à tout moment jusqu'ici.
- [ ] CI/CD + domaine custom en HTTPS (`julien-maxant.com`).

### Phase 6 — Vérification finale

- [ ] Repasser la Definition of Done (section 13) point par point.
- [ ] Build Hugo sans warning.

### Phase 7 — Recette (post-déploiement)

Différent de la Phase 6 : la Phase 6 vérifie qu'on a bien fait ce qui était prévu (DoD), la recette vérifie que ça marche réellement une fois tout en ligne ensemble — c'est là que les bugs et oublis se révèlent. Volontairement gardée légère au départ ; les bugs trouvés donneront lieu à des issues créées au fil de l'eau, pas anticipées ici.

- [ ] Recette fonctionnelle bout-en-bout en prod (accueil → projet → blog → contact).
- [ ] Recette responsive / cross-navigateur (mobile + desktop, au moins 2 navigateurs).
- [ ] Recette du switch light/dark en conditions réelles (bascule + persistance après rechargement).
- [ ] Recette SEO/GEO en prod (`sitemap.xml`, `robots.txt`, `llms.txt` accessibles ; JSON-LD validé via un outil externe).
- [ ] Recette des liens sortants (mailto, LinkedIn, GitHub) — pas de lien mort.

### Hors séquence / non bloquant

- Cadence de publication du blog (point ouvert 1) : décision éditoriale continue, pas une tâche à cocher une fois.
- Filtrage interactif JS (point ouvert 4) et traduction anglaise complète : hors V1, à traiter une fois le site en ligne et le volume de contenu suffisant (sections 5quinquies et 7).
