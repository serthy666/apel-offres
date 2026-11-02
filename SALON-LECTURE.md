# Salon de lecture et Espace gérant (APEL Éditions)

Le site **apel-offres.pages.dev** a maintenant, comme la boutique Shopping R-Lux, un **Espace gérant** avec connexion Google (`apeledition@gmail.com`), et un **Salon de lecture** : les livres se lisent en ligne, chapitre par chapitre.

- Les premiers chapitres de chaque livre sont **offerts**.
- Pour la suite, le lecteur demande un **code de lecture** sur WhatsApp (693 77 93 64) : **24 heures**, **1 semaine** ou **1 mois**. Il paie (Orange Money, MTN MoMo…), vous créez son code dans l'Espace gérant et vous le lui envoyez en un geste sur WhatsApp. Le lien envoyé active le code tout seul.
- Les **codes promo** (ex. `RENTREE2026`) donnent des jours de lecture offerts à tous ceux qui les utilisent, avec un nombre maximal de lecteurs et une date de fin.
- Les livres arrivent par un **fichier** (Word, LibreOffice, PDF, EPUB, RTF, page web, texte ou Markdown) ou par un **texte collé** : le site le découpe en chapitres et le met en forme pour la liseuse.
- De **petites vidéos** (bande-annonce d'un livre, mot de l'auteur, coulisses) s'ajoutent depuis le téléphone ou par un lien YouTube, TikTok, Facebook, Instagram ou Google Drive.

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

   Facultatif, pour envoyer des vidéos depuis le téléphone : Cloudflare > **R2** > Create bucket `apel-videos`, puis projet apel-offres > Settings > **Bindings** > Add > R2 bucket, Variable name **`MEDIAS`**. Sans lui, les vidéos s'ajoutent par lien (YouTube, TikTok…). La formule gratuite de R2 garde 10 Go, soit environ 300 vidéos de 2 minutes.

4. **Google Cloud** > API et services > Identifiants > le client OAuth « Application Web » > **Origines JavaScript autorisées** : ajouter `https://apel-offres.pages.dev`.
5. **Cloudflare** > apel-offres > Deployments > dernier déploiement > **Retry deployment** (les réglages ne comptent qu'à la publication suivante).
6. Ouvrir **https://apel-offres.pages.dev/gerant.html** (lien « Espace gérant » en bas de chaque page) et se connecter avec `apeledition@gmail.com`.

Tant que ces réglages manquent, le site marche comme avant : le Salon reste caché et l'Espace gérant l'explique.

## Au quotidien

**Publier un livre** (onglet « Livres à lire »)
1. Chaque chapitre commence par un titre de niveau 1 (style **Titre 1** dans Word ou LibreOffice, `#` en Markdown). Sans titres, une ligne courte qui commence par « Chapitre », « Prologue », « Épilogue », « Partie » ou « Acte » marche aussi. Le bouton « Télécharger le modèle Word » donne un exemple prêt à remplir.
2. « Ajouter un livre », choisir le livre dans la liste de la bibliothèque (il garde sa couverture), son **genre** (roman, nouvelles, poésie, contes, théâtre, essai, témoignage, jeunesse, feuilleton), puis « Choisir un fichier » ou « Coller le texte ».
3. Vérifier la liste des chapitres : décocher la page de titre ou les remerciements, corriger un titre, ouvrir un « Aperçu ». Choisir le nombre de **chapitres offerts**.
4. « Publier dans le Salon ». C'est en ligne tout de suite.

| Format | Ce qui est repris |
| --- | --- |
| Word `.docx`, LibreOffice `.odt`, RTF `.rtf` | titres, gras, italique, centrage, citations, séparateurs, intertitres |
| Livre numérique `.epub` | chapitres du sommaire du livre, gras, italique, citations |
| Page web `.html` | titres `<h1>`/`<h2>`, gras, italique, citations |
| PDF `.pdf` | paragraphes et chapitres (« Chapitre… » ou gros titres) ; ni gras ni italique, numéros de page et en-têtes répétés retirés |
| Texte `.txt`, Markdown `.md`, texte collé | paragraphes, vers des poèmes (lignes courtes), `# titres`, `**gras**`, `*italique*`, `> citations` |

Un ancien fichier Word `.doc` s'enregistre d'abord en `.docx` (Fichier > Enregistrer sous). Les images et les notes de bas de page ne sont pas reprises.

**Feuilleton** : pour sortir un livre semaine après semaine, « Modifier » > « **Ajouter à la suite** » et importer un fichier qui ne contient que les nouveaux chapitres. Ils apparaissent avec un badge « Nouveau » chez les lecteurs. « Remplacer tout le livre » sert à corriger le texte : les chapitres inchangés ne sont pas annoncés comme nouveaux.

**Créer un code** (onglet « Codes de lecture »)
- Choisir 24 heures, 1 semaine ou 1 mois, écrire le nom et le numéro WhatsApp du lecteur (facultatif), « Créer le code », puis « **Envoyer sur WhatsApp** » : le message part vers son numéro avec le code et le lien d'activation.
- La durée part de la **première utilisation**, pas de la création. Un code marche sur **2 appareils** au plus.
- « Révoquer » coupe la lecture tout de suite (code partagé, paiement annulé) ; « Rétablir » la rend.
- Les compteurs en haut montrent les lecteurs actifs et les codes vendus pas encore utilisés.

**Vidéos** (onglet « Vidéos ») : un titre, le livre concerné (facultatif), puis la vidéo du téléphone (MP4, 60 Mo au plus, 1 à 3 minutes ; sur iPhone, Réglages > Appareil photo > Formats > « Le plus compatible ») ou un lien. Une barre montre l'envoi ; une image de la vidéo sert d'affiche. Les vidéos défilent dans le Salon, et celles d'un livre s'affichent sur sa page. « Masquer » ou « Supprimer » à tout moment.

**Tarifs** : les prix de 24 h, 1 semaine et 1 mois (texte libre, ex. « 1 000 FCFA ») s'affichent aux lecteurs quand ils demandent un code. Le mot d'accueil du Salon s'y règle aussi.

**Gérants** : le propriétaire ajoute ou retire des Gmail. Un gérant crée des codes et publie des livres ; un gérant retiré perd l'accès tout de suite.

**Relire comme un abonné** : en bas de l'Espace gérant, « Lire comme un abonné sur cet appareil » donne un pass de 12 heures.

## Ce que voit le lecteur

- **Accueil** : le logo APEL Éditions en médaillon 3D (anneau vert, jaune et rouge, relief qui suit le doigt ou l'inclinaison du téléphone), puis « Nos univers » (Services et prix, Salon de lecture, Bibliothèque, Publier mon livre), « Je suis… », les offres phares, le Salon, la bibliothèque et « Tout savoir ». Tous les services d'avant sont toujours là.
- **Barre d'onglets** en bas : Accueil, Services, WhatsApp (bouton rond au centre), Livres, Lire. Une bulle de verre glisse vers l'onglet ouvert. Le bouton Partager est en haut.
- **Animations** : les pages arrivent en 3D, bloc par bloc ; on revient en arrière par la gauche ; un chapitre se tourne comme une page ; les fenêtres se déplient depuis le bas et se replient en se fermant ; les cartes s'enfoncent sous le doigt. Tout se calme si le téléphone demande moins d'animations.
- **Salon** : recherche par titre ou auteur, genres, vidéos, livres avec progression ; « Le Salon / Ma liseuse » en haut.
- **Liseuse** : page **Jour**, **Sépia**, **Sombre** ou **Nuit APEL** (toute la page prend la couleur choisie), police Classique, Moderne ou Très lisible, taille et espacement des lignes ; **mode lecture** plein écran (en-tête et barres effacés) ; barre d'outils qui s'efface quand on descend et revient quand on remonte ; temps de lecture restant ; écran gardé allumé ; reprise à la ligne près ; chapitre suivant préparé en avance ; chapitres déjà ouverts lisibles **sans réseau** ; glisser le doigt (ou flèches du clavier) pour changer de chapitre.
- **Ma liseuse** : lectures en cours, **marque-pages**, **passages favoris** (à transformer en carte-citation), réglages avec aperçu, carnet, bouton « Installer l'appli » quand le téléphone le permet.
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
- `gerant.html`, `gerant.js`, `textes.js` (lecture des fichiers dans le navigateur : docx, odt, epub, pdf, rtf, html, txt, md).
- `vendor/pdfjs/` : pdf.js de Mozilla (licence Apache 2.0), pour lire les PDF dans l'Espace gérant.
- `assets/logo-plume.webp` : le logo APEL Éditions (plume blanche) détouré pour le médaillon de l'accueil, tiré de `assets/icone-512.png`.
- `assets/modele-salon-apel.docx` : modèle Word (refait par `node tests/docx.mjs`).

## Tests

`node tests/formats.mjs` écrit le même livre en .docx, le fait convertir par LibreOffice en .odt, .rtf, .html, .epub et .pdf, ajoute un .txt, un .md et un texte collé, et vérifie que chacun donne les mêmes chapitres (avec gras, italique, séparateurs, citations, vers).

`node tests/salon.mjs` (Playwright) fait tout le parcours avec une fausse base D1 et une fausse connexion Google : Salon vide, compte refusé, import Word et aperçu, publication, codes 24 h / semaine / promo, tarifs, bloc d'accueil, chapitre offert et mise en forme, badge, réaction, réglages de la liseuse, carte-citation, verrou et demande de code sur WhatsApp, mauvais code, vidéos (lien et fichier, lecture par morceaux), logo et onglets de l'accueil, réglages et mode sombre de la liseuse, mode lecture, marque-page, passage favori, Ma liseuse et reprise, lecture sans réseau, flèches du clavier, activation par le champ puis par le lien, refus au 3e appareil, promo limitée, révocation, feuilleton, gérants, pass gérant, sécurité de l'API, version anglaise, absence d'erreur et de défilement horizontal.

`node tests/serveur.mjs` lance le site de test sur http://localhost:8790.
