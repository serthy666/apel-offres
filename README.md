# APEL Éditions · Nos offres

Mini-application à partager sur WhatsApp et les réseaux sociaux : packs et prix, démarche de commande, publication d'un livre, questions fréquentes. Chaque bouton ouvre une discussion WhatsApp avec APEL Éditions, avec un message déjà rédigé.

Adresse : **https://apel-offres.pages.dev/** (publiée par Cloudflare Pages à chaque envoi sur la branche `main`).

L'ancienne adresse https://serthy666.github.io/apel-offres/ renvoie vers la nouvelle : certains opérateurs, dont Orange Cameroun, bloquent les adresses `github.io`.

- Les offres et les prix se modifient dans le Google Sheet « APEL – Offres de l'appli (prix à modifier ici) », sans toucher à ce dépôt.
- Le dossier `functions/` produit les liens partagés `/l/<code>` (livre) et `/o/<code>` (offre) : aperçu WhatsApp et Facebook avec la couverture, le titre et le prix, puis ouverture de la fiche dans l'appli.
- Ce dépôt est public : il ne doit contenir que les fichiers du site, jamais de manuscrit, de contrat ni de données de client.
- Avant chaque nouvelle publication des fichiers, changer `VERSION` dans `sw.js`.

## Apparence

Fond vert très pâle, presque blanc, cartes blanches à ombre douce, grands titres : l'accueil s'inspire des pages Apple. Chaque univers (Services, Salon, Bibliothèque, Publier) a sa couleur et son objet 3D, pour qu'on le repère sans lire. En lecture de nuit (thèmes Nuit APEL et Sombre de la liseuse), toute la page repasse en sombre.

Les objets 3D (`assets/3d/`) viennent de Fluent Emoji de Microsoft, sous licence MIT : le texte de la licence est dans `assets/3d/LICENCE-fluent-emoji.txt` et doit rester à côté des images.

## Salon de lecture et Espace gérant

Les livres se lisent aussi en ligne, chapitre par chapitre : premiers chapitres offerts, puis codes de lecture de 24 heures, d'une semaine ou d'un mois, et codes promo, créés dans l'**Espace gérant** (https://apel-offres.pages.dev/gerant.html, connexion Google avec apeledition@gmail.com). Les livres arrivent par un fichier (Word, LibreOffice, PDF, EPUB, RTF, HTML, texte, Markdown) ou un texte collé ; de petites vidéos s'y ajoutent. Liseuse avec mode lecture, mode sombre et écoute (voix IA Google ou voix du téléphone). Mise en route et mode d'emploi : `SALON-LECTURE.md`.

## Autre site dans ce dépôt

Le dossier `shopping-rlux/` contient la boutique en ligne de Robyn Tyo’o (Shopping R-Lux, Douala), publiée à part sur Cloudflare (Worker `shopping-rlux`, Root directory `shopping-rlux`). Tout est expliqué dans `shopping-rlux/LISEZ-MOI.md`.
