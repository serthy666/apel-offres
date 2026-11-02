# Salon de lecture et Espace gérant (APEL Éditions)

Le site **apel-offres.pages.dev** a maintenant, comme la boutique Shopping R-Lux, un **Espace gérant** avec connexion Google (`apeledition@gmail.com`), et un **Salon de lecture** : les livres se lisent en ligne, chapitre par chapitre.

- Les premiers chapitres de chaque livre sont **offerts**.
- Pour la suite, le lecteur demande un **code de lecture** sur WhatsApp (693 77 93 64) : **24 heures**, **1 semaine** ou **1 mois**. Il paie (Orange Money, MTN MoMo…), vous créez son code dans l'Espace gérant et vous le lui envoyez en un geste sur WhatsApp. Le lien envoyé active le code tout seul.
- Les **codes promo** (ex. `RENTREE2026`) donnent des jours de lecture offerts à tous ceux qui les utilisent, avec un nombre maximal de lecteurs et une date de fin.
- Les livres arrivent par un simple **fichier Word (.docx)** : le site le découpe en chapitres et le met en forme pour la liseuse.

Les textes et les codes sont rangés dans une base **Cloudflare D1**, jamais dans GitHub (le dépôt est public).

## Mise en route (une seule fois, 10 minutes)

1. **Cloudflare** > Storage & Databases > **D1** > Create database. Nom : `apel-salon`.
2. **Cloudflare** > Workers & Pages > projet **apel-offres** > Settings > **Bindings** > Add > D1 database. Variable name : **`DB`** ; base : `apel-salon`. Les tables se créent toutes seules.
3. Même projet > Settings > **Variables and Secrets** :

| Nom | Valeur | Type |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | identifiant du client OAuth Google (`…apps.googleusercontent.com`), le même que pour R-Lux convient | Texte |
| `SESSION_SECRET` | une longue phrase inventée, d'au moins 16 caractères, à ne jamais montrer | **Secret** |
| `PROPRIETAIRE` | facultatif : `apeledition@gmail.com` par défaut | Texte |

4. **Google Cloud** > API et services > Identifiants > le client OAuth « Application Web » > **Origines JavaScript autorisées** : ajouter `https://apel-offres.pages.dev`.
5. **Cloudflare** > apel-offres > Deployments > dernier déploiement > **Retry deployment** (les réglages ne comptent qu'à la publication suivante).
6. Ouvrir **https://apel-offres.pages.dev/gerant.html** (lien « Espace gérant » en bas de chaque page) et se connecter avec `apeledition@gmail.com`.

Tant que ces réglages manquent, le site marche comme avant : le Salon reste caché et l'Espace gérant l'explique.

## Au quotidien

**Publier un livre** (onglet « Livres à lire »)
1. Dans Word, chaque chapitre commence par une ligne de style **Titre 1**. Sans ce style, une ligne courte qui commence par « Chapitre », « Prologue » ou « Épilogue » marche aussi. Le bouton « Télécharger le modèle Word » donne un exemple prêt à remplir.
2. « Ajouter un livre », choisir le livre dans la liste de la bibliothèque (il garde sa couverture), puis « Choisir le fichier Word ».
3. Vérifier la liste des chapitres : décocher la page de titre ou les remerciements, corriger un titre, ouvrir un « Aperçu ». Choisir le nombre de **chapitres offerts**.
4. « Publier dans le Salon ». C'est en ligne tout de suite.

Gardés de Word : gras, italique, paragraphes centrés, citations (style « Citation »), séparateurs de scène (`***`, `* * *`, `#`), intertitres (Titre 2). Les images et notes de bas de page ne sont pas reprises.

**Feuilleton** : pour sortir un livre semaine après semaine, « Modifier » > « **Ajouter à la suite** » et importer un fichier qui ne contient que les nouveaux chapitres. Ils apparaissent avec un badge « Nouveau » chez les lecteurs. « Remplacer tout le livre » sert à corriger le texte : les chapitres inchangés ne sont pas annoncés comme nouveaux.

**Créer un code** (onglet « Codes de lecture »)
- Choisir 24 heures, 1 semaine ou 1 mois, écrire le nom et le numéro WhatsApp du lecteur (facultatif), « Créer le code », puis « **Envoyer sur WhatsApp** » : le message part vers son numéro avec le code et le lien d'activation.
- La durée part de la **première utilisation**, pas de la création. Un code marche sur **2 appareils** au plus.
- « Révoquer » coupe la lecture tout de suite (code partagé, paiement annulé) ; « Rétablir » la rend.
- Les compteurs en haut montrent les lecteurs actifs et les codes vendus pas encore utilisés.

**Tarifs** : les prix de 24 h, 1 semaine et 1 mois (texte libre, ex. « 1 000 FCFA ») s'affichent aux lecteurs quand ils demandent un code. Le mot d'accueil du Salon s'y règle aussi.

**Gérants** : le propriétaire ajoute ou retire des Gmail. Un gérant crée des codes et publie des livres ; un gérant retiré perd l'accès tout de suite.

**Relire comme un abonné** : en bas de l'Espace gérant, « Lire comme un abonné sur cet appareil » donne un pass de 12 heures.

## Ce que voit le lecteur

- Sur l'accueil, un bloc « Le Salon de lecture » avec les couvertures ; dans la bibliothèque, un bouton « Lire en ligne » sur les livres disponibles.
- Une liseuse confortable : texte en grand, police réglable (A− A+), page **Nuit**, **Sépia** ou **Jour**, barre de progression, « Reprendre ma lecture » là où il s'était arrêté.
- **Carnet de lecture** : une **flamme** qui compte les jours de lecture d'affilée et **10 badges** à gagner (Hibou de nuit, Lève-tôt, Marathon, Mot de la fin…), avec une petite fête à chaque badge.
- **Réactions** à la fin de chaque chapitre (❤️ 😂 😮 😢 🔥), comptées pour tous les lecteurs.
- **Cartes-citations** : il touche un paragraphe, et le site en fait une belle image (format statut WhatsApp) avec le titre, l'auteur et l'adresse du Salon, à partager en un geste. Chaque citation partagée fait de la publicité au livre.
- En fin de livre, « Donner mon avis sur WhatsApp ».

Le carnet, les badges et la progression restent dans le téléphone du lecteur (pas de compte à créer).

## Bon à savoir

- Ne changez pas `SESSION_SECRET` sans raison : les lecteurs devraient retaper leur code (il reste valable jusqu'à sa date de fin) et les gérants se reconnecter.
- La formule gratuite de Cloudflare D1 (5 millions de lectures et 100 000 écritures par jour) suffit très largement.
- Après chaque changement de `index.html` ou de `lecture.js`, changer `VERSION` dans `sw.js`.

## Fichiers

- `functions/api/lecture.js` : côté lecteurs (catalogue, chapitres, activation des codes, réactions).
- `functions/api/gerant.js` : Espace gérant (connexion Google, codes, livres, tarifs, gérants).
- `functions/_lecture.js` : outils communs (base D1, jetons signés, formules).
- `lecture.js` : le Salon et la liseuse, chargés par `index.html` à la première visite de `#/lire`.
- `gerant.html`, `gerant.js`, `word.js` (lecture des fichiers Word dans le navigateur).
- `assets/modele-salon-apel.docx` : modèle Word (refait par `node tests/docx.mjs`).

## Tests

`node tests/salon.mjs` (Playwright) fait tout le parcours avec une fausse base D1 et une fausse connexion Google : Salon vide, compte refusé, import Word et aperçu, publication, codes 24 h / semaine / promo, tarifs, bloc d'accueil, chapitre offert et mise en forme, badge, réaction, réglages de la liseuse, carte-citation, verrou et demande de code sur WhatsApp, mauvais code, activation par le champ puis par le lien, refus au 3e appareil, promo limitée, révocation, feuilleton, gérants, pass gérant, sécurité de l'API, version anglaise, absence d'erreur et de défilement horizontal.

`node tests/serveur.mjs` lance le site de test sur http://localhost:8790.
