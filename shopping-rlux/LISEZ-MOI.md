# Boutique Shopping R-Lux (Robyn Tyo’o)

Boutique en ligne de **Shopping R-Lux**, la boutique de Robyn Tyo’o à Douala : parfumerie, soins du corps, lingerie et sous-vêtements, sacs et accessoires, et les romans qu’elle écrit. Charte noir et or à reflets, en « verre liquide » façon iPhone, pensée d’abord pour le téléphone.

Le client remplit un **panier**, indique **sa ville** (obligatoire), et la commande part sur **WhatsApp** avec un message déjà rédigé. La propriétaire (`shoppingrlux12@gmail.com`) remplit le catalogue depuis son téléphone, dans l’**Espace gérant**, et ajoute elle-même ses gérants par leur adresse Gmail.

Adresse prévue : https://shopping-rlux.apeledition.workers.dev (à créer une fois, voir « Mise en ligne »).

## Univers et catégories

Les articles qui se ressemblent sont regroupés :

| Univers | Catégories | Choix proposés au client (exemple) |
| --- | --- | --- |
| Parfumerie | Parfums, Brumes, Déodorants, Huiles de parfum, Parfums de maison | 30 ml, 50 ml, 100 ml |
| Soins du corps | Laits de toilette, Savons de toilette, Gommages corporels, Huiles, Savons | 250 ml, 500 ml |
| Lingerie et sous-vêtements | Sous-vêtements femmes, hommes, enfants ; Nuisettes et bikinis | S, M, L, XL |
| Sacs et accessoires | Sacs et accessoires, Gadgets du quotidien, Autres | Noir, Rouge, Beige |
| Livres de Robyn Tyo’o | Romans, Autres livres | |

Les deux romans de Robyn Tyo’o du catalogue APEL Éditions sont déjà en boutique : *Dans le miroir de nos désirs (Tome 1)* et *Souhaits maudits*, à 5 000 FCFA, avec leur résumé, leur couverture et le lien YouScribe de la version numérique. Les autres univers affichent « Bientôt » jusqu’à l’ajout des premiers articles.

## Côté clients

- **Panier** : quantités, taille ou contenance choisie dans la fiche, total. Avant l’envoi, le client choisit sa ville (Douala d’abord, puis les autres villes du pays, ou « Autre ville » à écrire), et peut ajouter son quartier et son nom. Douala : « livraison » ; ailleurs : « expédition », frais confirmés sur WhatsApp. Il choisit le numéro : 676 96 25 19 (WhatsApp) ou 690 80 81 55 (WhatsApp et appel). La ville est retenue pour la commande suivante.
- Exemple de message reçu :

  ```
  Bonjour Shopping R-Lux, je souhaite commander :

  • 2 × Eau de parfum Rose d'Or (100 ml) : 30 000 FCFA
  • 1 × Boxer coton homme (L) : 3 000 FCFA

  Total des articles : 33 000 FCFA
  Ville : Yaoundé (expédition)
  Quartier : Bastos
  Nom : Marie

  Merci de me confirmer la disponibilité, les frais d'expédition et le mode de paiement.
  ```
- **Recherche** sans accents, avec synonymes (« culotte », « boxer » → lingerie ; « eau de toilette » → parfums ; « roman » → livres) et budget (« 10000 », « 10k », « moins de 15 000 »). Si rien ne correspond, un bouton envoie la demande sur WhatsApp.
- **Fiche article** : photos à faire défiler, description, choix (taille, contenance…), quantité, « Une question ? » sur WhatsApp, partage du lien (`#p=…`), favoris, articles semblables. Pour un livre : auteur, résumé, version numérique.
- Article **épuisé** : « Me prévenir » envoie une demande sur WhatsApp, et la boutique signale au client le retour de l’article à sa visite suivante.
- **Communauté WhatsApp** : une section de l’accueil et le pied de page invitent à rejoindre le groupe et à suivre la chaîne de la boutique ; un univers encore vide propose aussi de suivre la chaîne pour être prévenu des arrivages.
- **Favoris**, articles **À la une** sur l’accueil, **annonce** en haut de page, page **Contact** (deux numéros, appel, e-mail, Facebook, TikTok).
- **Effets** : plaques de verre fumé bordées d’or, reflet qui suit le doigt, cartes qui s’inclinent en 3D au toucher, affiche qui suit l’inclinaison du téléphone, livres en 3D, barre d’onglets à bulle de verre, feuilles qui montent du bas et se ferment en glissant. Tout se calme si le téléphone demande moins d’animations.
- **Installable** comme une appli (`manifest.webmanifest`, `sw.js`) : la boutique s’ouvre même avec un réseau faible.

## Espace gérant (en bas de page, ou adresse `/#admin`)

- Connexion avec Google. Entrent seulement la propriétaire (`PROPRIETAIRE`) et les Gmail ajoutés dans « Gérants » (`site/donnees/comptes.json`). Session de 8 heures.
- **Ajouter un article** : photo (appareil photo ou galerie, réduite à 1 000 px par le téléphone), nom, univers, catégorie, marque, choix proposés au client (séparés par des virgules), description, prix (vide = « Prix sur demande »), prix promo (prix barré et badge de remise), stock (en stock, dernières pièces, épuisé), « Nouveau », « À la une », « Afficher ». Boutons « Placer en tête », « Dupliquer » (pour une variante) et « Supprimer ».
- **Coordonnées et annonce** : les deux numéros WhatsApp, l’e-mail, les liens Facebook et TikTok (sans lien, les boutons cherchent « Shopping R-Lux »), les liens du **groupe** et de la **chaîne WhatsApp** (un lien vidé masque son bouton), le texte de l’annonce. Un lien collé sans « https:// » est complété.
- **Enregistrer** écrit tout en **un seul commit** sur GitHub, avec un message clair : « R-Lux : Prix Souhaits maudits : 5 000 → 4 500 (gerant@gmail.com) ». Cloudflare republie la boutique en une minute environ. L’historique GitHub sert de journal ; « Revert » annule n’importe quel changement.
- **Gérants** : seule la propriétaire ajoute ou retire un gérant. Un gérant ajouté passe de « Invité » à « Actif » à sa première connexion. Un gérant retiré perd l’accès tout de suite.
- Si deux personnes enregistrent en même temps, la seconde est prévenue et recharge, au lieu d’écraser la première.

## Comment ça marche

- `site/` est servi tel quel : `index.html` (page et styles), `app.js`, `sw.js`, `assets/` (logo, icônes, affiche, image de partage), `polices/` (Cinzel, Montserrat, Great Vibes, hébergées ici pour un chargement rapide), `donnees/produits.json` (catalogue et coordonnées), `donnees/comptes.json` (gérants), `photos/`.
- `functions/api/gerant.js` est la fonction `/api/gerant` : vérification du jeton Google, liste des comptes, écriture dans GitHub. `worker.js` la branche quand la boutique tourne comme Worker Cloudflare.
- La boutique vit dans le dossier `shopping-rlux/` du dépôt `serthy666/apel-offres`. La fonction n’écrit que dans `shopping-rlux/site/donnees/` et `shopping-rlux/site/photos/` (variable `GITHUB_DOSSIER`).
- Les commandes ne sont **jamais** enregistrées sur un serveur : le panier reste dans le téléphone du client et la commande n’arrive que sur WhatsApp. Le dépôt est public : n’y mettez jamais de données de clients ni de secret.

## Mise en ligne (une seule fois)

La branche doit d’abord être fusionnée dans `main`, car Cloudflare publie `main` et la fonction gérant y écrit.

1. **Cloudflare** > Workers & Pages > Créer > Importer un dépôt > `serthy666/apel-offres`. Nom du projet : `shopping-rlux`. Dans les réglages de build : **Root directory** = `shopping-rlux`, commande de build vide, commande de déploiement `npx wrangler deploy` (lit `wrangler.jsonc`). Conseillé : « Build watch paths » = `shopping-rlux/*`, pour ne pas republier la boutique à chaque changement de l’appli APEL.
2. **Google Cloud** > API et services > Identifiants > ID client OAuth de type « Application Web », avec `https://shopping-rlux.apeledition.workers.dev` (et le futur nom de domaine) dans « Origines JavaScript autorisées ».
3. **GitHub** > Settings > Developer settings > Fine-grained tokens : dépôt `serthy666/apel-offres` seulement, permission **Contents : Read and write**, date d’expiration notée.
4. **Cloudflare** > projet `shopping-rlux` > Settings > Variables and Secrets :

| Nom | Valeur | Type |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | identifiant du client OAuth (`…apps.googleusercontent.com`) | Texte |
| `PROPRIETAIRE` | `shoppingrlux12@gmail.com` | Texte |
| `GITHUB_TOKEN` | le jeton GitHub de l’étape 3 | Secret |
| `GITHUB_REPO` | facultatif, `serthy666/apel-offres` par défaut | Texte |
| `GITHUB_BRANCH` | facultatif, `main` par défaut | Texte |
| `GITHUB_DOSSIER` | facultatif, `shopping-rlux` par défaut (`.` si la boutique a son propre dépôt) | Texte |

5. Ouvrir `https://shopping-rlux.apeledition.workers.dev/#admin` et se connecter avec `shoppingrlux12@gmail.com`.

Plus tard, la boutique peut avoir son propre dépôt (`serthy666/shopping-rlux`) : copier le contenu de ce dossier à la racine, puis régler `GITHUB_REPO=serthy666/shopping-rlux`, `GITHUB_DOSSIER=.` et un Root directory vide. Le jeton GitHub ne donne alors accès qu’à la boutique. Cloudflare Pages marche aussi : framework « None », build vide, dossier de sortie `site` ; `functions/` est pris automatiquement.

En secours : si la propriétaire perd son Gmail, changez `PROPRIETAIRE` dans Cloudflare puis republiez. Le jeton GitHub expire à la date choisie : renouvelez-le avant (sinon le gérant voit « Le jeton GitHub de la boutique est refusé »).

## Modifier le code

- Après chaque changement de `index.html` ou `app.js`, changez `CACHE` dans `site/sw.js` (`rlux-v2`, `rlux-v3`…) pour que les téléphones prennent la nouvelle version.
- Les univers et leurs catégories sont dans `RAYONS` (`site/app.js`) et la liste des univers permis dans `functions/api/gerant.js`.

## Tests

`node tests/parcours.mjs` (Playwright) fait tourner la vraie fonction gérant avec un faux GitHub et une fausse connexion Google (`tests/serveur.mjs`), sur un catalogue de départ fixe (les deux livres) qui ne dépend pas du vrai catalogue, à 320, 390, 768 et 1280 px : vitrine avec les deux livres, fiche d’un livre, panier qui refuse l’envoi sans ville, message WhatsApp (articles, choix, quantités, total, ville, livraison ou expédition, quartier, nom), second numéro, autre ville, compte refusé, ajout d’articles avec photo réduite à 1 000 px, promo refusée si plus chère, un seul commit par enregistrement, reste du dépôt intact, prix barré, choix obligatoire de la contenance, recherche avec synonymes et budget, univers vide, favoris, article épuisé et rappel, lien partagé, gérant invité puis actif sans droit d’ajouter de gérant, conflit entre deux gérants, retrait d’un gérant qui coupe sa session, suppression d’un article et de sa photo, annonce, groupe et chaîne WhatsApp, appli installable, absence d’erreur et de défilement horizontal.

`node tests/serveur.mjs` lance la même boutique de test sur http://localhost:8788.
