/* Salon de lecture et liseuse d'APEL Éditions : livres à lire en ligne, chapitre par chapitre.
   Chargé par index.html (#/lire, #/lire/<livre>, #/lire/<livre>/<n>, #/liseuse). Les textes arrivent de /api/lecture.
   - Premiers chapitres offerts ; la suite avec un code de lecture (24 h, semaine, mois ou promo) reçu sur WhatsApp.
   - Ma liseuse : lectures en cours, marque-pages, passages favoris, réglages (Jour, Sépia, Sombre, Nuit ; police,
     taille, interligne), mode lecture plein écran, écran gardé allumé, carnet (flamme et badges).
   - Liseuse fluide : reprise à la ligne près, chapitre suivant préparé en avance, chapitres déjà lus gardés pour
     une lecture sans réseau, glisser du doigt ou flèches du clavier pour changer de chapitre, barre qui s'efface.
   - Réactions par chapitre, cartes-citations à partager en statut WhatsApp, petites vidéos (bandes-annonces…). */
(function () {
'use strict';
var O = window.APEL_OUTILS;
if (!O) return;
var etat = O.etat, esc = O.esc, svg = O.svg;
var API = 'api/lecture';
var CALME = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- Textes ---------- */
var TX = {
  fr: {
    titre: 'Le Salon de lecture', intro: 'Des romans à lire ici, chapitre par chapitre. Les premiers chapitres sont offerts.',
    vide: 'Les premiers livres arrivent très bientôt dans le Salon. Revenez vite !',
    indispo: 'Le Salon de lecture ouvre bientôt. Écrivez-nous sur WhatsApp pour être prévenu.',
    onglSalon: 'Le Salon', onglLiseuse: 'Ma liseuse', aLire: 'Livres à lire',
    abonne: 'Lecture débloquée', jusqua: 'jusqu’au {d}', debloquer: 'Débloquer tous les chapitres', jaiCode: 'J’ai un code',
    reprendre: 'Reprendre ma lecture', chapitre: 'Chapitre {n}', chapitres: '{n} chapitres', unChapitre: '1 chapitre', min: '{n} min',
    commencer: 'Commencer la lecture', continuer: 'Continuer : chapitre {n}', relire: 'Relire depuis le début',
    sommaire: 'Sommaire', offert: 'Offert', nouveau: 'Nouveau', lu: 'Lu', verrou: 'Réservé aux abonnés',
    suivant: 'Chapitre suivant', precedent: 'Chapitre précédent', finLivre: 'Fin du livre… pour l’instant !', finLivreD: 'Vous avez tout lu. Dites à l’auteur ce que vous en avez pensé, ou partagez le livre à un ami.',
    donnerAvis: 'Donner mon avis sur WhatsApp', msgAvis: 'Je viens de finir « {t} » dans le Salon de lecture. Mon avis : ',
    laSuite: 'La suite vous attend', laSuiteD: 'Débloquez tous les chapitres de tous les livres du Salon avec un code de lecture, reçu sur WhatsApp en quelques minutes.',
    reactions: 'Ce chapitre vous a fait…', coeur: 'J’adore', rire: 'Rire', choc: 'Choc', larme: 'Ému', feu: 'Captivant',
    partagerChap: 'Partager ce chapitre', astuce: 'Astuce : touchez un paragraphe pour en faire une carte-citation. Glissez le doigt vers la gauche pour le chapitre suivant.',
    restant: '≈ {n} min restantes', restant1: 'moins d’une minute', reprise: 'Reprise là où vous vous étiez arrêté',
    chercher: 'Chercher un livre ou un auteur', tous: 'Tous', aucun: 'Aucun livre ne correspond.',
    videos: 'Les vidéos', videosLivre: 'En vidéo', lireLivre: 'Lire le livre', voirVideo: 'Regarder : {t}', videoSuivante: 'Vidéo suivante', videoPrecedente: 'Vidéo précédente',
    // Liseuse
    reglages: 'Réglages de lecture', aa: 'Réglages de lecture', taille: 'Taille du texte', theme: 'Couleur de la page', police: 'Police', interligne: 'Espacement des lignes',
    jour: 'Jour', sepia: 'Sépia', sombre: 'Sombre', nuit: 'Nuit APEL',
    p_serif: 'Classique', p_sans: 'Moderne', p_lisible: 'Très lisible',
    i_serre: 'Serré', i_normal: 'Normal', i_aere: 'Aéré',
    apercuTexte: 'Le soleil se levait sur Douala. Amina ouvrit son livre, et la ville tout entière sembla retenir son souffle.',
    modeLecture: 'Mode lecture', modeLectureD: 'Plein écran, sans rien autour du texte', quitterModeLecture: 'Quitter le mode lecture',
    ecranAllume: 'Garder l’écran allumé pendant la lecture',
    marquePage: 'Marque-page', marquePageAjoute: 'Marque-page posé', marquesPages: 'Mes marque-pages', aucunMarque: 'Touchez 🔖 pendant la lecture pour poser un marque-page.',
    favoris: 'Mes passages favoris', aucunFavori: 'Touchez un paragraphe, puis « Garder ce passage ».', garderPassage: 'Garder ce passage', passageGarde: 'Passage gardé dans Ma liseuse', retirer: 'Retirer',
    enCours: 'Mes lectures en cours', aucuneLecture: 'Commencez un livre du Salon : il apparaîtra ici.', allerSalon: 'Aller au Salon',
    horsLigneDispo: 'Gardé pour la lecture sans réseau',
    // Déblocage
    feuilleTitre: 'Débloquer la lecture', feuilleIntro: 'Choisissez votre formule, demandez votre code sur WhatsApp, puis entrez-le ci-dessous. Un code donne accès à tous les livres du Salon.',
    f_jour: '24 heures', f_semaine: '1 semaine', f_mois: '1 mois', tarifWa: 'tarif sur WhatsApp', demander: 'Demander',
    msgFormule: 'Je souhaite un code de lecture du Salon : formule {f}{p}. Je paie par Orange Money ou MTN MoMo.',
    votreCode: 'Votre code de lecture', activer: 'Activer mon code', activation: 'Vérification…', bienvenue: 'Bienvenue au Salon ! Lecture débloquée {j}.',
    codeVide: 'Entrez le code reçu sur WhatsApp.', horsLigne: 'Pas de connexion internet. Vérifiez le réseau puis réessayez.',
    expire: 'Votre code de lecture a expiré. Demandez-en un nouveau sur WhatsApp.', fermer: 'Fermer',
    // Carnet
    carnet: 'Mon carnet de lecture', flamme: '{n} jour de suite', flammes: '{n} jours de suite', flamme0: 'Lisez un chapitre aujourd’hui pour allumer votre flamme',
    lusTotal: '{n} chapitre lu', lusTotaux: '{n} chapitres lus', badgeGagne: 'Nouveau badge : {b}',
    b_premier: 'Premier chapitre', b_premier_d: 'Lire un chapitre en entier',
    b_flamme3: 'Flamme', b_flamme3_d: 'Lire 3 jours de suite',
    b_flamme7: 'Brasier', b_flamme7_d: 'Lire 7 jours de suite',
    b_nuit: 'Hibou de nuit', b_nuit_d: 'Lire entre 22 h et 5 h',
    b_matin: 'Lève-tôt', b_matin_d: 'Lire avant 7 h',
    b_marathon: 'Marathon', b_marathon_d: '5 chapitres le même jour',
    b_fin: 'Mot de la fin', b_fin_d: 'Finir un livre',
    b_explorateur: 'Explorateur', b_explorateur_d: 'Commencer 3 livres',
    b_citation: 'Plume d’or', b_citation_d: 'Partager une carte-citation',
    b_avis: 'Cœur battant', b_avis_d: 'Réagir à un chapitre',
    // Citation
    citation: 'Carte-citation', citationCreer: 'Citer ce passage', citationPartager: 'Partager l’image', citationTelecharger: 'Enregistrer l’image',
    citationWa: 'Envoyer le texte sur WhatsApp', citationPied: 'Lu dans le Salon de lecture d’APEL Éditions', citationAlt: 'Carte-citation à partager',
    erreur: 'Une erreur est survenue. Réessayez.', chargement: 'Chargement…', retourSalon: 'Salon', introuvable: 'Ce livre n’est plus dans le Salon.', reessayer: 'Réessayer',
    g_roman: 'Romans', g_nouvelles: 'Nouvelles', g_poesie: 'Poésie', g_conte: 'Contes', g_theatre: 'Théâtre', g_essai: 'Essais', g_temoignage: 'Témoignages', g_jeunesse: 'Jeunesse', g_feuilleton: 'Feuilletons', g_autre: 'Autres'
  },
  en: {
    titre: 'The Reading Lounge', intro: 'Novels to read right here, chapter by chapter. The first chapters are free.',
    vide: 'The first books are arriving in the Lounge very soon. Come back soon!',
    indispo: 'The Reading Lounge opens soon. Message us on WhatsApp to be told when.',
    onglSalon: 'The Lounge', onglLiseuse: 'My reader', aLire: 'Books to read',
    abonne: 'Reading unlocked', jusqua: 'until {d}', debloquer: 'Unlock every chapter', jaiCode: 'I have a code',
    reprendre: 'Continue reading', chapitre: 'Chapter {n}', chapitres: '{n} chapters', unChapitre: '1 chapter', min: '{n} min',
    commencer: 'Start reading', continuer: 'Continue: chapter {n}', relire: 'Read again from the start',
    sommaire: 'Contents', offert: 'Free', nouveau: 'New', lu: 'Read', verrou: 'Subscribers only',
    suivant: 'Next chapter', precedent: 'Previous chapter', finLivre: 'The end… for now!', finLivreD: 'You have read it all. Tell the author what you thought, or share the book with a friend.',
    donnerAvis: 'Give my opinion on WhatsApp', msgAvis: 'I have just finished “{t}” in the Reading Lounge. My opinion: ',
    laSuite: 'The rest is waiting for you', laSuiteD: 'Unlock every chapter of every book in the Lounge with a reading code, sent on WhatsApp within minutes.',
    reactions: 'This chapter made me…', coeur: 'Love it', rire: 'Laugh', choc: 'Shocked', larme: 'Moved', feu: 'Gripped',
    partagerChap: 'Share this chapter', astuce: 'Tip: tap a paragraph to turn it into a quote card. Swipe left for the next chapter.',
    restant: '≈ {n} min left', restant1: 'less than a minute', reprise: 'Back where you left off',
    chercher: 'Search a book or an author', tous: 'All', aucun: 'No book matches.',
    videos: 'Videos', videosLivre: 'On video', lireLivre: 'Read the book', voirVideo: 'Watch: {t}', videoSuivante: 'Next video', videoPrecedente: 'Previous video',
    reglages: 'Reading settings', aa: 'Reading settings', taille: 'Text size', theme: 'Page colour', police: 'Font', interligne: 'Line spacing',
    jour: 'Day', sepia: 'Sepia', sombre: 'Dark', nuit: 'APEL night',
    p_serif: 'Classic', p_sans: 'Modern', p_lisible: 'Easy to read',
    i_serre: 'Tight', i_normal: 'Normal', i_aere: 'Airy',
    apercuTexte: 'The sun was rising over Douala. Amina opened her book, and the whole city seemed to hold its breath.',
    modeLecture: 'Reading mode', modeLectureD: 'Full screen, nothing around the text', quitterModeLecture: 'Leave reading mode',
    ecranAllume: 'Keep the screen on while reading',
    marquePage: 'Bookmark', marquePageAjoute: 'Bookmark added', marquesPages: 'My bookmarks', aucunMarque: 'Tap 🔖 while reading to add a bookmark.',
    favoris: 'My favourite passages', aucunFavori: 'Tap a paragraph, then “Keep this passage”.', garderPassage: 'Keep this passage', passageGarde: 'Passage kept in My reader', retirer: 'Remove',
    enCours: 'Currently reading', aucuneLecture: 'Start a book in the Lounge: it will appear here.', allerSalon: 'Go to the Lounge',
    horsLigneDispo: 'Saved for offline reading',
    feuilleTitre: 'Unlock reading', feuilleIntro: 'Choose your plan, ask for your code on WhatsApp, then enter it below. One code opens every book in the Lounge.',
    f_jour: '24 hours', f_semaine: '1 week', f_mois: '1 month', tarifWa: 'price on WhatsApp', demander: 'Ask',
    msgFormule: 'I would like a Reading Lounge code: {f} plan{p}. I will pay by Orange Money or MTN MoMo.',
    votreCode: 'Your reading code', activer: 'Activate my code', activation: 'Checking…', bienvenue: 'Welcome to the Lounge! Reading unlocked {j}.',
    codeVide: 'Enter the code you received on WhatsApp.', horsLigne: 'No internet connection. Check your network and try again.',
    expire: 'Your reading code has expired. Ask for a new one on WhatsApp.', fermer: 'Close',
    carnet: 'My reading log', flamme: '{n} day in a row', flammes: '{n} days in a row', flamme0: 'Read a chapter today to light your flame',
    lusTotal: '{n} chapter read', lusTotaux: '{n} chapters read', badgeGagne: 'New badge: {b}',
    b_premier: 'First chapter', b_premier_d: 'Read a whole chapter',
    b_flamme3: 'Flame', b_flamme3_d: 'Read 3 days in a row',
    b_flamme7: 'Blaze', b_flamme7_d: 'Read 7 days in a row',
    b_nuit: 'Night owl', b_nuit_d: 'Read between 10 pm and 5 am',
    b_matin: 'Early bird', b_matin_d: 'Read before 7 am',
    b_marathon: 'Marathon', b_marathon_d: '5 chapters in one day',
    b_fin: 'The last word', b_fin_d: 'Finish a book',
    b_explorateur: 'Explorer', b_explorateur_d: 'Start 3 books',
    b_citation: 'Golden quill', b_citation_d: 'Share a quote card',
    b_avis: 'Beating heart', b_avis_d: 'React to a chapter',
    citation: 'Quote card', citationCreer: 'Quote this passage', citationPartager: 'Share the image', citationTelecharger: 'Save the image',
    citationWa: 'Send the text on WhatsApp', citationPied: 'Read in the APEL Éditions Reading Lounge', citationAlt: 'Quote card to share',
    erreur: 'Something went wrong. Please try again.', chargement: 'Loading…', retourSalon: 'Lounge', introuvable: 'This book is no longer in the Lounge.', reessayer: 'Try again',
    g_roman: 'Novels', g_nouvelles: 'Short stories', g_poesie: 'Poetry', g_conte: 'Tales', g_theatre: 'Drama', g_essai: 'Essays', g_temoignage: 'Memoirs', g_jeunesse: 'Young readers', g_feuilleton: 'Serials', g_autre: 'Other'
  }
};
function tx(k, v) { var s = (TX[etat.lang] && TX[etat.lang][k]) || TX.fr[k] || k; if (v) Object.keys(v).forEach(function (x) { s = s.split('{' + x + '}').join(v[x]); }); return s; }

var EMOJIS = [['coeur', '❤️'], ['rire', '😂'], ['choc', '😮'], ['larme', '😢'], ['feu', '🔥']];
var BADGES = [['premier', '📖'], ['flamme3', '🔥'], ['flamme7', '🏆'], ['nuit', '🦉'], ['matin', '🌅'], ['marathon', '⚡'], ['fin', '🏁'], ['explorateur', '🧭'], ['citation', '✨'], ['avis', '💬']];
var THEMES = ['jour', 'sepia', 'sombre', 'nuit'], POLICES = ['serif', 'sans', 'lisible'], INTERLIGNES = { serre: 1.5, normal: 1.7, aere: 1.95 };

/* ---------- Mémoire du téléphone ---------- */
function lireJ(k, d) { try { var v = JSON.parse(O.stock(k) || 'null'); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }
function ecrireJ(k, v) { O.stock(k, JSON.stringify(v)); }
function appareil() {
  var a = O.stock('apel-appareil');
  if (!/^[a-z0-9]{16,40}$/.test(a || '')) {
    var o = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(o);
    a = ''; for (var i = 0; i < o.length; i++) a += (o[i] % 36).toString(36);
    a = a + Date.now().toString(36);
    O.stock('apel-appareil', a);
  }
  return a;
}
function pass() { var p = lireJ('apel-pass', null); return p && p.jeton && p.fin * 1000 > Date.now() ? p : null; }
var prefs = lireJ('apel-liseuse', {});
prefs.taille = Math.max(15, Math.min(28, parseInt(prefs.taille, 10) || 19));
if (THEMES.indexOf(prefs.theme) < 0) prefs.theme = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'sepia' : 'nuit';
if (POLICES.indexOf(prefs.police) < 0) prefs.police = 'serif';
if (!INTERLIGNES[prefs.interligne]) prefs.interligne = 'normal';
if (prefs.allume == null) prefs.allume = true;
function sauverPrefs() { ecrireJ('apel-liseuse', prefs); }
var lu = lireJ('apel-lu', {});          // { livre: { dernier: n, quand, pos: { n, r }, chap: { n: 'AAAA-MM-JJ' } } }
var carnet = lireJ('apel-carnet', { jours: {}, badges: {} });   // jours : { 'AAAA-MM-JJ': nombre de chapitres }
if (!carnet.jours) carnet.jours = {};
if (!carnet.badges) carnet.badges = {};
var marques = lireJ('apel-marques', { l: [] }).l || [];     // [{ livre, n, r, extrait, t }]
var favoris = lireJ('apel-favoris', { l: [] }).l || [];     // [{ livre, n, texte, t }]
function sauverMarques() { ecrireJ('apel-marques', { l: marques.slice(0, 60) }); }
function sauverFavoris() { ecrireJ('apel-favoris', { l: favoris.slice(0, 100) }); }

function aujourdhui(d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function flamme() {
  var n = 0, d = new Date();
  if (!carnet.jours[aujourdhui(d)]) d.setDate(d.getDate() - 1); // la flamme tient jusqu'à ce soir minuit
  while (carnet.jours[aujourdhui(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function totalLus() { var n = 0; Object.keys(lu).forEach(function (k) { n += Object.keys(lu[k].chap || {}).length; }); return n; }
// Petite vibration de confirmation, seulement après un geste du lecteur (le navigateur l'interdit sinon).
function vibrer(ms) { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms || 12); } catch (e) {} }
function gagner(b) {
  if (carnet.badges[b]) return;
  carnet.badges[b] = aujourdhui(); ecrireJ('apel-carnet', carnet);
  var e = BADGES.filter(function (x) { return x[0] === b; })[0];
  setTimeout(function () { O.message(tx('badgeGagne', { b: (e ? e[1] + ' ' : '') + tx('b_' + b) })); feuxDArtifice(e ? e[1] : '✨'); vibrer([10, 40, 10]); }, 400);
}
// Chapitre lu jusqu'au bout : carnet, flamme et badges.
function marquerLu(livre, n) {
  var l = lu[livre] = lu[livre] || { chap: {} };
  if (l.chap[n]) return;
  l.chap[n] = aujourdhui(); ecrireJ('apel-lu', lu);
  var j = aujourdhui(); carnet.jours[j] = (carnet.jours[j] || 0) + 1; ecrireJ('apel-carnet', carnet);
  var h = new Date().getHours();
  gagner('premier');
  if (h >= 22 || h < 5) gagner('nuit');
  if (h >= 5 && h < 7) gagner('matin');
  if (carnet.jours[j] >= 5) gagner('marathon');
  var f = flamme(); if (f >= 3) gagner('flamme3'); if (f >= 7) gagner('flamme7');
  if (Object.keys(lu).length >= 3) gagner('explorateur');
  var ls = O.livreSalon(livre);
  if (ls && ls.chapitres.every(function (c) { return l.chap[c.n]; })) gagner('fin');
}
function ouvrirChapitre(livre, n) {
  var l = lu[livre] = lu[livre] || { chap: {} };
  if (!l.chap) l.chap = {};
  l.dernier = n; l.quand = Date.now(); ecrireJ('apel-lu', lu);
}

/* ---------- Échanges avec le serveur ---------- */
function appel(params, corps) {
  var h = {}, p = pass();
  if (p) h.authorization = 'Bearer ' + p.jeton;
  if (corps) h['content-type'] = 'application/json';
  return fetch(API + (params ? '?' + params : ''), { method: corps ? 'POST' : 'GET', headers: h, body: corps ? JSON.stringify(corps) : undefined, cache: 'no-store' })
    .then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.erreur || tx('erreur')); e.statut = r.status; e.verrou = !!d.verrou; throw e; }
        return d;
      });
    }, function () { var e = new Error(tx('horsLigne')); e.statut = 0; throw e; });
}
// Chapitres déjà ouverts, gardés dans le téléphone pour une lecture sans réseau
// (un chapitre payant jusqu'à la fin du code de lecture seulement). 15 chapitres au plus.
function cacheLire(k) {
  var c = lireJ('apel-chap:' + k, null);
  if (!c || !c.d || (c.x && c.x * 1000 < Date.now())) return null;
  return c.d;
}
function cacheEcrire(k, d) {
  var p = pass(), index = lireJ('apel-chap-index', { l: [] }).l || [];
  ecrireJ('apel-chap:' + k, { d: d, x: d.offert ? 0 : (p ? p.fin : Math.floor(Date.now() / 1000) + 3600) });
  index = [k].concat(index.filter(function (x) { return x !== k; }));
  index.slice(15).forEach(function (x) { O.stock('apel-chap:' + x, ''); });
  ecrireJ('apel-chap-index', { l: index.slice(0, 15) });
}
function cacheOublier(k) { O.stock('apel-chap:' + k, ''); }
var chapitres = {}; // 'livre/n' → { ok: données } ou { verrou: true } ou { erreur } ou { attente }
function chargerChapitre(livre, n, enAvance) {
  var k = livre + '/' + n;
  if (chapitres[k] && (chapitres[k].ok || chapitres[k].attente)) return;
  var garde = cacheLire(k);
  if (garde) chapitres[k] = { ok: garde, garde: true };
  else chapitres[k] = { attente: true };
  appel('action=chapitre&livre=' + encodeURIComponent(livre) + '&n=' + n).then(function (d) {
    var avant = chapitres[k] && chapitres[k].ok ? JSON.stringify(chapitres[k].ok.blocs) : '';
    chapitres[k] = { ok: d };
    cacheEcrire(k, d);
    return avant !== JSON.stringify(d.blocs) && !enAvance;
  }, function (e) {
    if (e.verrou) {
      cacheOublier(k);
      if (pass() && !enAvance) { O.stock('apel-pass', ''); O.message(tx('expire')); }
      chapitres[k] = { verrou: true };
      return !enAvance;
    }
    // Sans réseau, le chapitre gardé reste affiché.
    if (garde) { chapitres[k] = { ok: garde, garde: true }; return false; }
    chapitres[k] = { erreur: e.message };
    return !enAvance;
  }).then(function (rafraichir) {
    var r = O.route();
    if (rafraichir && r.nom === 'lire' && r.args[0] === livre && +r.args[1] === n) O.afficher(true);
  });
}

/* ---------- Aides d'affichage ---------- */
function dateLisible(s) {
  try { return new Date(s * 1000).toLocaleString(etat.lang === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
}
function minutes(mots) { return Math.max(1, Math.round((mots || 0) / 230)); }
function recent(c) { return c.maj && Date.now() / 1000 - c.maj < 7 * 86400; }
function chapLus(id) { return (lu[id] && lu[id].chap) || {}; }
function ouvert(ls, n) { return n <= ls.gratuits || !!pass(); }
function couverture(ls, w) {
  var l = O.livreParId(ls.id) || { id: ls.id, titre: ls.titre, auteur: ls.auteur };
  return '<span class="sl-couv"><span class="couv" style="padding-top:' + (O.ratioLivre(l) * 100).toFixed(1) + '%">' + O.imgCouv(l, w || 132) + '</span></span>';
}
function barre(p) { return '<span class="sl-barre" aria-hidden="true"><i style="width:' + Math.round(p * 100) + '%"></i></span>'; }
function lien(href, html, cls) { return '<a class="' + (cls || 'btn btn-verre btn-plein') + '" href="' + href + '">' + html + '</a>'; }
function retourVers(href, libelle) { return '<a class="retour verre" href="' + href + '">' + svg('retour', 18) + '<span>' + esc(libelle) + '</span></a>'; }
function squelette() { return '<div aria-busy="true"><div class="squelette petit"></div><div class="squelette"></div><div class="squelette"></div></div>'; }
function bascule(actif) {
  return '<div class="sl-bascule" role="tablist"><a role="tab" href="#/lire" aria-selected="' + (actif === 'salon') + '">' + svg('ouvert', 18) + esc(tx('onglSalon')) + '</a>' +
    '<a role="tab" href="#/liseuse" aria-selected="' + (actif === 'liseuse') + '">' + svg('flamme', 18) + esc(tx('onglLiseuse')) + '</a><span class="sl-bascule-bulle" aria-hidden="true"></span></div>';
}

function blocPass() {
  var p = pass();
  if (p) return '<div class="sl-pass verre"><span class="sl-pass-ic" aria-hidden="true">✓</span><span><b>' + esc(tx('abonne')) + (p.formule ? ' · ' + esc(p.formule) : '') + '</b><span>' + esc(tx('jusqua', { d: dateLisible(p.fin) })) + '</span></span></div>';
  return '<div class="sl-actions"><button type="button" class="btn btn-primaire" data-sl="debloquer">' + svg('cadenas') + '<span>' + esc(tx('debloquer')) + '</span></button>' +
    '<button type="button" class="btn btn-verre" data-sl="code">' + esc(tx('jaiCode')) + '</button></div>';
}
function blocCarnet() {
  var f = flamme(), n = totalLus();
  var badges = BADGES.map(function (b) {
    var a = !!carnet.badges[b[0]];
    return '<li class="' + (a ? 'gagne' : '') + '" title="' + esc(tx('b_' + b[0] + '_d')) + '"><span aria-hidden="true">' + b[1] + '</span><b>' + esc(tx('b_' + b[0])) + '</b><small>' + esc(tx('b_' + b[0] + '_d')) + '</small>' + (a ? '' : '<span class="sr"> (' + (etat.lang === 'en' ? 'not yet' : 'pas encore') + ')</span>') + '</li>';
  }).join('');
  return '<section class="verre panneau sl-carnet"><h2 class="h3">' + esc(tx('carnet')) + '</h2>' +
    '<div class="sl-flamme' + (f ? ' allumee' : '') + '"><span class="sl-feu" aria-hidden="true">' + (f ? '🔥' : '🕯️') + '</span><span><b>' + esc(f ? tx(f > 1 ? 'flammes' : 'flamme', { n: f }) : tx('flamme0')) + '</b>' +
    '<span>' + esc(tx(n > 1 ? 'lusTotaux' : 'lusTotal', { n: n })) + '</span></span></div><ul class="sl-badges">' + badges + '</ul></section>';
}
function carteLivre(ls) {
  var lus = chapLus(ls.id), nb = ls.chapitres.length, faits = ls.chapitres.filter(function (c) { return lus[c.n]; }).length;
  var neuf = ls.chapitres.some(function (c) { return recent(c) && !lus[c.n]; });
  return '<a class="sl-livre verre inclinable" href="#/lire/' + encodeURIComponent(ls.id) + '">' + couverture(ls, 96) +
    '<span class="sl-infos">' + (neuf ? '<span class="badge">' + esc(tx('nouveau')) + '</span>' : '') + '<b lang="fr">' + esc(ls.titre) + '</b>' + (ls.auteur ? '<span>' + esc(ls.auteur) + '</span>' : '') +
    '<small>' + esc([ls.genre ? tx('g_' + ls.genre) : '', nb > 1 ? tx('chapitres', { n: nb }) : tx('unChapitre')].filter(Boolean).join(' · ')) + (O.offerts(ls) ? ' · ' + esc(O.offerts(ls)) : '') + '</small>' + (faits ? barre(faits / nb) : '') + '</span></a>';
}
function carteVideo(v) {
  return '<button type="button" class="sl-video' + (v.vertical ? '' : ' horizontale') + '" data-sl="video" data-val="' + esc(v.id) + '" aria-label="' + esc(tx('voirVideo', { t: v.titre })) + '">' +
    (v.vignette ? '<img src="' + esc(v.vignette) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '') +
    '<span class="sl-lecture" aria-hidden="true">' + svg('lecture') + '</span><b>' + esc(v.titre) + '</b></button>';
}
function rangVideos(videos, titre) {
  if (!videos || !videos.length) return '';
  return '<h2 style="margin:22px 4px 10px">' + esc(titre) + '</h2><div class="sl-videos">' + videos.map(carteVideo).join('') + '</div>';
}

/* ---------- Vues ---------- */
var recherche = '', genre = '';
function vueSalon() {
  var s = etat.salon;
  if (!s) return squelette();
  if (etat.codeLien) setTimeout(function () { var c = etat.codeLien; etat.codeLien = ''; try { sessionStorage.removeItem('apel-code'); } catch (e) {} feuilleDeblocage(c); }, 0);
  var tete = '<h1 class="titre-page">' + esc(tx('titre')) + '</h1>' + bascule('salon') + '<p class="muet intro">' + esc(s.accueil || tx('intro')) + '</p>';
  if (!s.livres.length) return tete + '<div class="verre panneau"><p style="margin:0 0 12px">' + esc(tx(s.indisponible ? 'indispo' : 'vide')) + '</p>' + O.aWa([O.t('msgSalon')], O.t('ecrireWa'), 'btn-primaire btn-plein') + '</div>' + rangVideos(s.videos, tx('videos'));
  // « Reprendre » : le dernier livre ouvert encore dans le Salon.
  var dernier = enCours()[0], reprise = '';
  if (dernier) {
    var ld = O.livreSalon(dernier), n = lu[dernier].dernier;
    reprise = '<a class="sl-reprise verre inclinable" href="#/lire/' + encodeURIComponent(dernier) + '/' + n + '">' + couverture(ld, 60) + '<span><small>' + esc(tx('reprendre')) + '</small><b lang="fr">' + esc(ld.titre) + '</b><span>' + esc(tx('chapitre', { n: n })) + '</span></span><span class="fl">' + svg('fl', 18) + '</span></a>';
  }
  var genres = []; s.livres.forEach(function (l) { if (l.genre && genres.indexOf(l.genre) < 0) genres.push(l.genre); });
  var filtres = (s.livres.length > 3 ? '<label class="sr" for="sl-cherche">' + esc(tx('chercher')) + '</label><input class="sl-cherche" id="sl-cherche" type="search" placeholder="' + esc(tx('chercher')) + '" value="' + esc(recherche) + '" autocomplete="off">' : '') +
    (genres.length > 1 ? '<div class="sl-genres" role="group">' + [''].concat(genres).map(function (g) { return '<button type="button" data-sl="genre" data-val="' + g + '" aria-pressed="' + (genre === g) + '">' + esc(g ? tx('g_' + g) : tx('tous')) + '</button>'; }).join('') + '</div>' : '');
  return tete + blocPass() + reprise + rangVideos(s.videos, tx('videos')) + (s.videos && s.videos.length ? '<h2 style="margin:22px 4px 10px">' + esc(tx('aLire')) + '</h2>' : '') + filtres + '<div class="sl-liste" id="sl-liste">' + listeLivres() + '</div>';
}
function plat(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function listeLivres() {
  var q = plat(recherche).trim();
  var l = etat.salon.livres.filter(function (x) { return (!genre || x.genre === genre) && (!q || plat(x.titre + ' ' + x.auteur + ' ' + (x.genre ? tx('g_' + x.genre) : '')).indexOf(q) >= 0); });
  return l.length ? l.map(carteLivre).join('') : '<p class="muet" style="margin:8px 4px">' + esc(tx('aucun')) + '</p>';
}
function enCours() {
  return Object.keys(lu).filter(function (id) { return lu[id].dernier && O.livreSalon(id); }).sort(function (a, b) { return (lu[b].quand || 0) - (lu[a].quand || 0); });
}

function vueLivre(id) {
  var ls = O.livreSalon(id);
  if (!ls) return etat.salon ? retourVers('#/lire', tx('retourSalon')) + '<p class="muet" style="margin:16px 4px">' + esc(tx('introuvable')) + '</p>' : squelette();
  var lus = chapLus(id), dernier = lu[id] && lu[id].dernier;
  var mots = ls.chapitres.reduce(function (s, c) { return s + (c.mots || 0); }, 0);
  var suite = dernier ? lien('#/lire/' + encodeURIComponent(id) + '/' + dernier, svg('ouvert') + '<span>' + esc(tx('continuer', { n: dernier })) + '</span>', 'btn btn-primaire btn-plein')
    : lien('#/lire/' + encodeURIComponent(id) + '/1', svg('ouvert') + '<span>' + esc(tx('commencer')) + '</span>', 'btn btn-primaire btn-plein');
  var liste = ls.chapitres.map(function (c) {
    var o = ouvert(ls, c.n), etiquette = lus[c.n] ? '<span class="sl-lu">✓ ' + esc(tx('lu')) + '</span>' : recent(c) ? '<span class="badge">' + esc(tx('nouveau')) + '</span>' : c.n <= ls.gratuits && !pass() ? '<span class="sl-offert">' + esc(tx('offert')) + '</span>' : '';
    return '<li><a href="#/lire/' + encodeURIComponent(id) + '/' + c.n + '"' + (o ? '' : ' class="ferme"') + '><span class="sl-num">' + c.n + '</span><span><b lang="fr">' + esc(c.titre || tx('chapitre', { n: c.n })) + '</b><span>' + esc(tx('min', { n: minutes(c.mots) })) + (o ? '' : ' · ' + esc(tx('verrou'))) + '</span></span>' + etiquette + (o ? '' : '<span class="fl">' + svg('cadenas', 18) + '</span>') + '</a></li>';
  }).join('');
  var faits = ls.chapitres.filter(function (c) { return lus[c.n]; }).length;
  var vids = ((etat.salon && etat.salon.videos) || []).filter(function (v) { return v.livre === id; });
  return retourVers('#/lire', tx('retourSalon')) + '<article class="pile">' +
    '<div class="sl-entete"><div class="sl-entete-couv">' + couverture(ls, 132) + '</div><div><h1 class="titre-page" lang="fr" style="margin:0 0 6px">' + esc(ls.titre) + '</h1>' +
    '<p class="muet" style="margin:0 0 6px">' + esc([ls.auteur, ls.genre ? tx('g_' + ls.genre) : '', ls.chapitres.length > 1 ? tx('chapitres', { n: ls.chapitres.length }) : tx('unChapitre'), tx('min', { n: minutes(mots) })].filter(Boolean).join(' · ')) + '</p>' +
    (O.offerts(ls) ? '<p class="sl-offert" style="display:inline-block;margin:0">' + esc(O.offerts(ls)) + '</p>' : '') + (faits ? barre(faits / ls.chapitres.length) : '') + '</div></div>' +
    (ls.resume ? '<div class="verre panneau"><p style="margin:0" lang="fr">' + esc(ls.resume).replace(/\n/g, '<br>') + '</p></div>' : '') +
    suite + (pass() ? '' : blocPass()) + rangVideos(vids, tx('videosLivre')) +
    '<h2 style="margin:22px 4px 10px">' + esc(tx('sommaire')) + '</h2><ul class="liens verre sl-sommaire">' + liste + '</ul></article>';
}

function rendreRuns(r) {
  return r.map(function (x) {
    var h = esc(x[0]).replace(/\n/g, '<br>'), f = x[1] || 0;
    if (f & 2) h = '<em>' + h + '</em>';
    if (f & 1) h = '<strong>' + h + '</strong>';
    return h;
  }).join('');
}
function rendreBlocs(blocs) {
  var i = 0;
  return blocs.map(function (b) {
    if (b.s === 'sep') return '<p class="sl-sep" aria-hidden="true">✦ ✦ ✦</p>';
    if (b.s === 'h') return '<h3>' + rendreRuns(b.r) + '</h3>';
    var cls = b.s === 'c' ? 'sl-c' : b.s === 'q' ? 'sl-q' : '';
    // Paragraphe avec retours à la ligne (poème, lettre) : pas de retrait de première ligne.
    if (!cls && b.r.some(function (x) { return x[0].indexOf('\n') >= 0; })) cls = 'sl-vers';
    return '<p data-para="' + (i++) + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + rendreRuns(b.r) + '</p>';
  }).join('');
}
function classesLiseuse() { return 'liseuse sl-th-' + prefs.theme + ' sl-po-' + prefs.police; }
function styleLiseuse() { return '--sl-taille:' + prefs.taille + 'px;--sl-interligne:' + INTERLIGNES[prefs.interligne]; }
function outilsChapitre() {
  return '<div class="sl-outils"><button type="button" data-sl="reglages" aria-label="' + esc(tx('aa')) + '"><span aria-hidden="true">Aa</span></button>' +
    '<button type="button" data-sl="marque" aria-label="' + esc(tx('marquePage')) + '"><span aria-hidden="true">🔖</span></button>' +
    '<button type="button" data-sl="immersif" aria-pressed="' + document.body.classList.contains('immersif') + '" aria-label="' + esc(tx('modeLecture')) + '">' + svg('agrandir', 20) + '</button></div>';
}
function vueChapitre(id, n) {
  var ls = O.livreSalon(id);
  if (!ls) return vueLivre(id);
  var meta = ls.chapitres.filter(function (c) { return c.n === n; })[0];
  if (!meta) { setTimeout(function () { location.replace('#/lire/' + encodeURIComponent(id)); }, 0); return ''; }
  ouvrirChapitre(id, n);
  var k = id + '/' + n, c = chapitres[k];
  if (!c || c.attente) { chargerChapitre(id, n); c = chapitres[k]; }
  var tete = '<div class="sl-haut" id="sl-haut">' + retourVers('#/lire/' + encodeURIComponent(id), ls.titre) + outilsChapitre() + '</div>';
  var titre = (/^\s*(chap|prologue|[ée]pilogue)/i.test(meta.titre || '') ? '<p class="sl-surtitre" aria-hidden="true">✦</p>' : '<p class="sl-surtitre">' + esc(tx('chapitre', { n: n })) + '</p>') +
    '<h1 class="sl-titre" lang="fr">' + esc(meta.titre || tx('chapitre', { n: n })) + '</h1><p class="sl-restant" id="sl-restant">' + esc(tx('restant', { n: minutes(meta.mots) })) + '</p>';
  var corps;
  if (c.attente) corps = '<div aria-busy="true"><div class="squelette"></div><div class="squelette"></div><div class="squelette"></div></div>';
  else if (c.verrou || (!c.ok && !ouvert(ls, n))) corps = carteSuite(ls, n, true);
  else if (c.erreur) corps = '<p>' + esc(c.erreur) + '</p><button type="button" class="btn btn-verre" data-sl="reessayer" data-val="' + esc(k) + '">' + esc(tx('reessayer')) + '</button>';
  else {
    var suivant = ls.chapitres.filter(function (x) { return x.n === n + 1; })[0];
    corps = '<div class="sl-texte" lang="fr">' + rendreBlocs(c.ok.blocs) + '</div><span id="sl-fin"></span>' +
      '<p class="sl-astuce">' + esc(tx('astuce')) + '</p>' +
      '<section class="sl-reactions" aria-label="' + esc(tx('reactions')) + '"><p>' + esc(tx('reactions')) + '</p><div id="sl-emojis">' + emojis({ comptes: {}, moi: '' }) + '</div></section>' +
      (suivant ? (ouvert(ls, n + 1) ? lien('#/lire/' + encodeURIComponent(id) + '/' + (n + 1), '<span>' + esc(tx('suivant')) + '</span>' + svg('fl'), 'btn btn-primaire btn-plein sl-suivant') : carteSuite(ls, n + 1))
        : '<div class="sl-suite"><span class="sl-suite-ic" aria-hidden="true">🏁</span><h2 class="h3">' + esc(tx('finLivre')) + '</h2><p>' + esc(tx('finLivreD')) + '</p>' + O.aWa([tx('msgAvis', { t: ls.titre })], tx('donnerAvis'), 'btn-primaire btn-plein') + '</div>') +
      '<button type="button" class="btn btn-verre btn-plein" data-partage="lire:' + esc(id) + '/' + n + '">' + svg('partage') + esc(tx('partagerChap')) + '</button>' +
      (n > 1 ? lien('#/lire/' + encodeURIComponent(id) + '/' + (n - 1), esc(tx('precedent'))) : '');
    setTimeout(function () { apresChapitre(id, n, suivant && ouvert(ls, n + 1) ? n + 1 : 0); }, 0);
  }
  return '<article class="' + classesLiseuse() + '" style="' + styleLiseuse() + '">' + tete + titre + corps + '</article>';
}
function carteSuite(ls, n, ici) {
  var reste = ls.chapitres.filter(function (c) { return c.n >= n; }).length;
  return '<div class="sl-suite"><span class="sl-suite-ic" aria-hidden="true">🔒</span><h2 class="h3">' + esc(tx('laSuite')) + '</h2>' +
    '<p>' + esc(tx('laSuiteD')) + '</p>' + (ici ? '' : '<p class="muet" style="font-size:14px">' + esc(reste > 1 ? tx('chapitres', { n: reste }) : tx('unChapitre')) + '</p>') + blocPass() + '</div>';
}
function emojis(d) {
  return EMOJIS.map(function (e) {
    var n = d.comptes[e[0]] || 0, moi = d.moi === e[0];
    return '<button type="button" data-sl="reagir" data-val="' + e[0] + '" aria-pressed="' + moi + '" aria-label="' + esc(tx(e[0])) + (n ? ' (' + n + ')' : '') + '"><span aria-hidden="true">' + e[1] + '</span><small>' + (n || '') + '</small></button>';
  }).join('');
}

/* ---------- Ma liseuse ---------- */
function blocReglages(dansFeuille) {
  function choix(nom, valeurs, libelle, actuel, extra) {
    return '<div class="sl-choix" role="group" aria-label="' + esc(libelle) + '">' + valeurs.map(function (v) {
      return '<button type="button" data-sl="pref" data-pref="' + nom + '" data-val="' + v + '" aria-pressed="' + (actuel === v) + '"' + (extra ? extra(v) : '') + '>' + esc(tx((nom === 'police' ? 'p_' : nom === 'interligne' ? 'i_' : '') + v)) + '</button>';
    }).join('') + '</div>';
  }
  return '<div class="sl-reglages">' +
    '<p class="sl-etiq">' + esc(tx('theme')) + '</p><div class="sl-themes" role="group" aria-label="' + esc(tx('theme')) + '">' + THEMES.map(function (th) {
      return '<button type="button" data-sl="pref" data-pref="theme" data-val="' + th + '" aria-pressed="' + (prefs.theme === th) + '" class="sl-pastille sl-' + th + '"><span>Aa</span><small>' + esc(tx(th)) + '</small></button>';
    }).join('') + '</div>' +
    '<p class="sl-etiq">' + esc(tx('taille')) + '</p><div class="sl-taille"><button type="button" data-sl="moins" aria-label="' + esc(tx('taille')) + ' −">A−</button>' +
    '<input type="range" min="15" max="28" step="1" value="' + prefs.taille + '" data-sl-taille aria-label="' + esc(tx('taille')) + '"><button type="button" data-sl="plus" aria-label="' + esc(tx('taille')) + ' +">A+</button></div>' +
    '<p class="sl-etiq">' + esc(tx('police')) + '</p>' + choix('police', POLICES, tx('police'), prefs.police, function (v) { return ' class="sl-po-' + v + '"'; }) +
    '<p class="sl-etiq">' + esc(tx('interligne')) + '</p>' + choix('interligne', Object.keys(INTERLIGNES), tx('interligne'), prefs.interligne) +
    '<label class="sl-case"><input type="checkbox" data-sl-allume' + (prefs.allume ? ' checked' : '') + '> ' + esc(tx('ecranAllume')) + '</label>' +
    (dansFeuille ? '' : '<div class="' + classesLiseuse() + ' sl-apercu-texte" style="' + styleLiseuse() + '"><p class="sl-texte" lang="fr"><span>' + esc(tx('apercuTexte')) + '</span></p></div>') + '</div>';
}
function vueLiseuse() {
  var cours = enCours(), salon = etat.salon;
  var lectures = cours.length ? '<div class="sl-liste">' + cours.slice(0, 6).map(function (id) {
    var ls = O.livreSalon(id), l = lu[id], faits = Object.keys(l.chap || {}).length;
    return '<a class="sl-reprise verre inclinable" href="#/lire/' + encodeURIComponent(id) + '/' + l.dernier + '">' + couverture(ls, 60) + '<span><b lang="fr">' + esc(ls.titre) + '</b><span>' + esc(tx('chapitre', { n: l.dernier })) + ' · ' + Math.round(faits / ls.chapitres.length * 100) + ' %</span>' + barre(faits / ls.chapitres.length) + '</span><span class="fl">' + svg('fl', 18) + '</span></a>';
  }).join('') + '</div>' : '<div class="verre panneau"><p class="muet" style="margin:0 0 12px">' + esc(tx('aucuneLecture')) + '</p>' + lien('#/lire', svg('ouvert') + '<span>' + esc(tx('allerSalon')) + '</span>', 'btn btn-primaire btn-plein') + '</div>';
  var ms = marques.filter(function (m) { return !salon || O.livreSalon(m.livre); });
  var listeMarques = ms.length ? '<ul class="liens verre sl-notes">' + ms.map(function (m, i) {
    var ls = O.livreSalon(m.livre);
    return '<li><a href="#/lire/' + encodeURIComponent(m.livre) + '/' + m.n + '" data-sl="aller-marque" data-val="' + i + '"><span class="sl-note-ic" aria-hidden="true">🔖</span><span><b lang="fr">' + esc((ls ? ls.titre : m.livre) + ' · ' + tx('chapitre', { n: m.n })) + '</b><span lang="fr">' + esc(m.extrait || '') + '</span></span></a><button type="button" class="sl-suppr" data-sl="suppr-marque" data-val="' + i + '" aria-label="' + esc(tx('retirer')) + '">×</button></li>';
  }).join('') + '</ul>' : '<p class="muet sl-vide">' + esc(tx('aucunMarque')) + '</p>';
  var listeFavoris = favoris.length ? '<ul class="sl-favoris">' + favoris.map(function (f, i) {
    var ls = O.livreSalon(f.livre);
    return '<li class="verre"><blockquote lang="fr">« ' + esc(f.texte.length > 320 ? f.texte.slice(0, 310) + '…' : f.texte) + ' »</blockquote><p>' + esc((ls ? ls.titre : f.livre) + ' · ' + tx('chapitre', { n: f.n })) + '</p><div class="sl-actions-petites">' +
      '<button type="button" class="btn btn-verre" data-sl="carte-favori" data-val="' + i + '">✨ ' + esc(tx('citation')) + '</button><button type="button" class="btn btn-verre" data-sl="suppr-favori" data-val="' + i + '">' + esc(tx('retirer')) + '</button></div></li>';
  }).join('') + '</ul>' : '<p class="muet sl-vide">' + esc(tx('aucunFavori')) + '</p>';
  return '<h1 class="titre-page">' + esc(tx('onglLiseuse')) + '</h1>' + bascule('liseuse') +
    '<h2 style="margin:18px 4px 10px">' + esc(tx('enCours')) + '</h2>' + lectures +
    '<h2 style="margin:22px 4px 10px">' + esc(tx('reglages')) + '</h2><section class="verre panneau">' + blocReglages(false) +
    '<button type="button" class="btn btn-verre btn-plein" data-sl="immersif" style="margin-top:14px">' + svg('agrandir') + '<span>' + esc(tx('modeLecture')) + ' · ' + esc(tx('modeLectureD')) + '</span></button></section>' +
    '<h2 style="margin:22px 4px 10px">' + esc(tx('marquesPages')) + '</h2>' + listeMarques +
    '<h2 style="margin:22px 4px 10px">' + esc(tx('favoris')) + '</h2>' + listeFavoris +
    blocCarnet() + '<div style="margin-top:16px">' + blocPass() + O.boutonInstaller('btn-verre btn-plein') + '</div>';
}

/* ---------- Pendant la lecture d'un chapitre ---------- */
var observateur = null, ecouteDefilement = null, verrouEcran = null, minuteurPos = null, dernierY = 0, prefetchFait = '';
function barreProgres() {
  var b = document.getElementById('sl-progres-global');
  if (!b) { b = document.createElement('div'); b.id = 'sl-progres-global'; b.className = 'sl-progres'; b.setAttribute('aria-hidden', 'true'); b.innerHTML = '<i></i>'; document.body.appendChild(b); }
  return b;
}
function ratioLecture() {
  var t = document.querySelector('.sl-texte');
  if (!t) return 0;
  var r = t.getBoundingClientRect(), total = r.height - window.innerHeight * .6;
  return Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
}
function garderEcranAllume() {
  if (!prefs.allume || !navigator.wakeLock || verrouEcran) return;
  navigator.wakeLock.request('screen').then(function (v) { verrouEcran = v; v.addEventListener('release', function () { verrouEcran = null; }); }).catch(function () {});
}
function libererEcran() { if (verrouEcran) { verrouEcran.release().catch(function () {}); verrouEcran = null; } }
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && document.querySelector('.sl-texte')) garderEcranAllume(); });
function apresChapitre(id, n, prochain) {
  var fin = document.getElementById('sl-fin');
  if (!fin) return;
  if (observateur) observateur.disconnect();
  if ('IntersectionObserver' in window) {
    observateur = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { marquerLu(id, n); observateur.disconnect(); } });
    observateur.observe(fin);
  }
  barreProgres().hidden = false;
  garderEcranAllume();
  // Reprise à l'endroit exact où le lecteur s'était arrêté dans ce chapitre
  var pos = lu[id] && lu[id].pos;
  if (pos && pos.n === n && pos.r > 0.03 && pos.r < 0.97 && window.scrollY < 50) {
    var t = document.querySelector('.sl-texte');
    if (t) {
      var cible = t.getBoundingClientRect().top + window.scrollY + pos.r * (t.offsetHeight - window.innerHeight * .6);
      window.scrollTo({ top: cible, behavior: CALME ? 'auto' : 'smooth' });
      O.message(tx('reprise'));
    }
  }
  if (!ecouteDefilement) {
    ecouteDefilement = function () {
      var b = document.getElementById('sl-progres-global'), r = O.route();
      if (!b || r.nom !== 'lire' || r.args.length < 2 || !document.querySelector('.sl-texte')) return;
      var x = ratioLecture();
      b.firstChild.style.width = (x * 100).toFixed(1) + '%';
      // La barre d'outils s'efface quand on descend dans le texte et revient quand on remonte.
      var y = window.scrollY, haut = document.getElementById('sl-haut');
      if (haut) haut.classList.toggle('cachee', y > dernierY + 4 && y > 160);
      if (haut && y < dernierY - 4) haut.classList.remove('cachee');
      document.body.classList.toggle('outils-caches', !!(haut && haut.classList.contains('cachee')));
      dernierY = y;
      var ls = O.livreSalon(r.args[0]), meta = ls && ls.chapitres.filter(function (c) { return c.n === +r.args[1]; })[0];
      var rest = document.getElementById('sl-restant');
      if (rest && meta) { var m = Math.round(minutes(meta.mots) * (1 - x)); rest.textContent = m >= 1 ? tx('restant', { n: m }) : tx('restant1'); }
      // Chapitre suivant préparé en avance, pour qu'il s'ouvre tout de suite
      var pr = +document.body.getAttribute('data-prochain') || 0;
      if (pr && x > 0.6 && prefetchFait !== r.args[0] + '/' + pr) { prefetchFait = r.args[0] + '/' + pr; chargerChapitre(r.args[0], pr, true); }
      clearTimeout(minuteurPos);
      minuteurPos = setTimeout(function () { var l = lu[r.args[0]]; if (l) { l.pos = { n: +r.args[1], r: +ratioLecture().toFixed(3) }; ecrireJ('apel-lu', lu); } }, 600);
    };
    window.addEventListener('scroll', ecouteDefilement, { passive: true });
  }
  document.body.setAttribute('data-prochain', prochain || '');
  dernierY = window.scrollY;
  ecouteDefilement();
  appel('action=reactions&livre=' + encodeURIComponent(id) + '&n=' + n + '&appareil=' + appareil()).then(function (d) {
    var z = document.getElementById('sl-emojis'); if (z) z.innerHTML = emojis(d);
  }, function () {});
}
function quitterLecture() {
  var b = document.getElementById('sl-progres-global'); if (b) b.hidden = true;
  libererEcran();
  document.body.classList.remove('outils-caches');
  if (document.body.classList.contains('immersif')) basculerImmersif(false);
  delete document.documentElement.dataset.liseuse;
}
// Mode lecture : plein écran, en-tête et barres effacés, seul le texte reste.
function basculerImmersif(oui) {
  oui = oui == null ? !document.body.classList.contains('immersif') : oui;
  document.body.classList.toggle('immersif', oui);
  var d = document.documentElement;
  try {
    if (oui && d.requestFullscreen && !document.fullscreenElement) d.requestFullscreen({ navigationUI: 'hide' }).catch(function () {});
    if (!oui && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
  } catch (e) {}
  [].forEach.call(document.querySelectorAll('[data-sl="immersif"]'), function (b) { b.setAttribute('aria-pressed', String(oui)); });
  var q = document.getElementById('sl-quitter');
  if (oui && !q) { q = document.createElement('button'); q.type = 'button'; q.id = 'sl-quitter'; q.className = 'btn btn-verre'; q.setAttribute('data-sl', 'immersif'); document.body.appendChild(q); }
  if (q) { q.hidden = !oui; q.innerHTML = svg('reduire', 18) + '<span>' + esc(tx('quitterModeLecture')) + '</span>'; }
}
document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && document.body.classList.contains('immersif')) basculerImmersif(false); });
// Le fond de toute la page prend la couleur choisie pour la liseuse.
function appliquerFond() {
  var r = O.route();
  if (r.nom === 'lire' && r.args.length > 1) document.documentElement.dataset.liseuse = prefs.theme;
  else delete document.documentElement.dataset.liseuse;
}
function appliquerPrefs() {
  sauverPrefs();
  [].forEach.call(document.querySelectorAll('.liseuse'), function (l) {
    l.className = classesLiseuse() + (l.classList.contains('sl-apercu-texte') ? ' sl-apercu-texte' : '');
    l.setAttribute('style', styleLiseuse());
  });
  [].forEach.call(document.querySelectorAll('[data-sl="pref"]'), function (b) { b.setAttribute('aria-pressed', String(prefs[b.getAttribute('data-pref')] === b.getAttribute('data-val'))); });
  [].forEach.call(document.querySelectorAll('[data-sl-taille]'), function (i) { i.value = prefs.taille; });
  appliquerFond();
}
function poserMarque() {
  var r = O.route(), id = r.args[0], n = +r.args[1];
  // Extrait : le premier paragraphe visible à l'écran
  var extrait = '';
  [].some.call(document.querySelectorAll('.sl-texte p'), function (p) { var b = p.getBoundingClientRect(); if (b.bottom > 80) { extrait = (p.textContent || '').trim().slice(0, 140); return true; } return false; });
  marques = [{ livre: id, n: n, r: +ratioLecture().toFixed(3), extrait: extrait, t: Date.now() }].concat(marques.filter(function (m) { return !(m.livre === id && m.n === n); }));
  sauverMarques(); vibrer(); O.message(tx('marquePageAjoute'));
}

/* ---------- Glisser du doigt et clavier : chapitre suivant ou précédent ---------- */
var toucheDebut = null;
document.addEventListener('touchstart', function (e) {
  if (!e.target.closest || !e.target.closest('.sl-texte') || e.touches.length > 1) { toucheDebut = null; return; }
  toucheDebut = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
}, { passive: true });
document.addEventListener('touchend', function (e) {
  if (!toucheDebut) return;
  var dx = e.changedTouches[0].clientX - toucheDebut.x, dy = e.changedTouches[0].clientY - toucheDebut.y, dt = Date.now() - toucheDebut.t;
  toucheDebut = null;
  if (Math.abs(dx) < 90 || Math.abs(dy) > 50 || dt > 700) return;
  changerChapitre(dx < 0 ? 1 : -1);
}, { passive: true });
document.addEventListener('keydown', function (e) {
  if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || document.querySelector('.voile')) return;
  if (!document.querySelector('.sl-texte')) return;
  if (e.key === 'ArrowRight') changerChapitre(1);
  else if (e.key === 'ArrowLeft') changerChapitre(-1);
});
function changerChapitre(sens) {
  var r = O.route(), ls = O.livreSalon(r.args[0]), n = +r.args[1] + sens;
  if (r.nom !== 'lire' || !ls || !ls.chapitres.some(function (c) { return c.n === n; })) return;
  if (!ouvert(ls, n)) { feuilleDeblocage(); return; }
  vibrer(8);
  location.hash = '#/lire/' + encodeURIComponent(r.args[0]) + '/' + n;
}

/* ---------- Feuilles (fenêtres du bas) ---------- */
var feuilleOuverte = null;
function feuille(html, auFermer, classe) {
  if (feuilleOuverte) feuilleOuverte.fermer(true);
  var avant = document.activeElement;
  var voile = document.createElement('div'); voile.className = 'voile' + (classe ? ' ' + classe : '');
  voile.innerHTML = '<div class="feuille verre flottant" role="dialog" aria-modal="true">' + html + '</div>';
  function fermer(sansFocus) {
    O.replier(voile); document.removeEventListener('keydown', echap); feuilleOuverte = null;
    if (auFermer) auFermer();
    if (!sansFocus && avant && avant.focus && document.contains(avant)) avant.focus();
  }
  function echap(e) { if (e.key === 'Escape') fermer(); }
  voile.addEventListener('click', function (e) { if (e.target === voile || e.target.closest('[data-fermer]')) fermer(); });
  document.addEventListener('keydown', echap);
  document.body.appendChild(voile);
  voile.fermer = fermer; feuilleOuverte = voile;
  return voile;
}
function feuilleDeblocage(code) {
  if (document.querySelector('.voile:not(.sortie)')) return;
  var tarifs = (etat.salon && etat.salon.tarifs) || {};
  var formules = ['jour', 'semaine', 'mois'].map(function (f) {
    var p = tarifs[f];
    var msg = tx('msgFormule', { f: tx('f_' + f), p: p ? ' (' + p + ')' : '' });
    return '<a class="sl-formule verre" target="_blank" rel="noopener" href="' + esc(O.lienWa([msg])) + '"><b>' + esc(tx('f_' + f)) + '</b><span>' + esc(p || tx('tarifWa')) + '</span><em>' + svg('wa') + esc(tx('demander')) + '</em></a>';
  }).join('');
  var v = feuille('<h2 id="titre-deblocage">' + esc(tx('feuilleTitre')) + '</h2><p class="muet" style="font-size:15px">' + esc(tx('feuilleIntro')) + '</p>' +
    '<div class="sl-formules">' + formules + '</div>' +
    '<form class="sl-code" novalidate><label for="sl-code">' + esc(tx('votreCode')) + '</label><input id="sl-code" name="code" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="ABCD-EFGH" maxlength="30" value="' + esc(code || '') + '">' +
    '<p class="sl-erreur" role="alert" hidden></p><button class="btn btn-primaire btn-plein" type="submit">' + esc(tx('activer')) + '</button></form>' +
    '<button type="button" class="btn btn-verre btn-plein" data-fermer style="margin-top:10px">' + esc(tx('fermer')) + '</button>');
  v.querySelector('.feuille').setAttribute('aria-labelledby', 'titre-deblocage');
  var form = v.querySelector('form'), champ = v.querySelector('#sl-code'), err = v.querySelector('.sl-erreur'), bouton = form.querySelector('button');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var c = champ.value.trim();
    if (!c) { err.hidden = false; err.textContent = tx('codeVide'); champ.focus(); return; }
    bouton.disabled = true; bouton.textContent = tx('activation'); err.hidden = true;
    appel('', { action: 'activer', code: c, appareil: appareil() }).then(function (d) {
      ecrireJ('apel-pass', { jeton: d.jeton, fin: d.fin, formule: d.formule || '', type: d.type });
      chapitres = {}; // les chapitres verrouillés se rechargent
      v.fermer();
      O.message(tx('bienvenue', { j: tx('jusqua', { d: dateLisible(d.fin) }) }));
      feuxDArtifice('📚'); vibrer([15, 60, 15]);
      O.afficher(true);
    }, function (e) {
      bouton.disabled = false; bouton.textContent = tx('activer');
      err.hidden = false; err.textContent = e.message; champ.focus();
      var f = v.querySelector('.feuille'); f.classList.remove('secoue'); void f.offsetWidth; f.classList.add('secoue'); vibrer(30);
    });
  });
  if (code) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
  else (code === '' ? champ : v.querySelector('a,button,input')).focus();
}
function feuilleReglages() {
  var v = feuille('<h2 id="titre-reglages">' + esc(tx('reglages')) + '</h2>' + blocReglages(true) +
    '<button type="button" class="btn btn-verre btn-plein" data-sl="immersif" style="margin-top:12px">' + svg('agrandir') + '<span>' + esc(tx('modeLecture')) + '</span></button>' +
    '<button type="button" class="btn btn-primaire btn-plein" data-fermer style="margin-top:10px">' + esc(tx('fermer')) + '</button>', null, 'voile-leger');
  v.querySelector('.feuille').setAttribute('aria-labelledby', 'titre-reglages');
  v.querySelector('button').focus();
}

/* ---------- Vidéos ---------- */
function videos() { return (etat.salon && etat.salon.videos) || []; }
function ouvrirVideo(id) {
  var l = videos(), i = 0;
  l.forEach(function (v, k) { if (v.id === id) i = k; });
  var v = l[i];
  if (!v) return;
  var media = v.type === 'fichier'
    ? '<video src="' + esc(v.src) + '"' + (v.vignette ? ' poster="' + esc(v.vignette) + '"' : '') + ' controls autoplay playsinline preload="metadata"></video>'
    : '<iframe src="' + esc(v.embed) + '" title="' + esc(v.titre) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe>';
  var ls = v.livre && O.livreSalon(v.livre), lb = v.livre && O.livreParId(v.livre);
  var html = '<div class="sl-ecran' + (v.vertical ? ' vertical' : '') + '">' + media + '</div><h2 id="titre-video" style="margin:12px 0 4px">' + esc(v.titre) + '</h2>' +
    (v.description ? '<p class="muet" style="font-size:15px">' + esc(v.description) + '</p>' : '') + '<div class="pile">' +
    (ls ? '<a class="btn btn-primaire" href="#/lire/' + encodeURIComponent(v.livre) + '">' + svg('ouvert') + '<span>' + esc(tx('lireLivre')) + '</span></a>' : lb ? '<a class="btn btn-primaire" href="#/livre/' + encodeURIComponent(v.livre) + '">' + svg('livre') + '<span>' + esc(O.t('voirLivre')) + '</span></a>' : '') +
    (l.length > 1 ? '<div class="sl-actions"><button type="button" class="btn btn-verre" data-sl="video" data-val="' + esc(l[(i - 1 + l.length) % l.length].id) + '">' + svg('retour', 18) + esc(tx('videoPrecedente')) + '</button><button type="button" class="btn btn-verre" data-sl="video" data-val="' + esc(l[(i + 1) % l.length].id) + '">' + esc(tx('videoSuivante')) + svg('fl', 18) + '</button></div>' : '') +
    '<button type="button" class="btn btn-verre" data-fermer>' + esc(tx('fermer')) + '</button></div>';
  var f = feuille(html, null, 'voile-video');
  f.querySelector('.feuille').setAttribute('aria-labelledby', 'titre-video');
  f.querySelector('[data-fermer]').focus({ preventScroll: true });
}

/* ---------- Carte-citation : une image prête pour le statut WhatsApp ---------- */
function lignes(ctx, texte, largeur) {
  var res = [];
  texte.split('\n').forEach(function (para) {
    var mots = para.split(/\s+/), l = '';
    mots.forEach(function (m) { var e = l ? l + ' ' + m : m; if (ctx.measureText(e).width > largeur && l) { res.push(l); l = m; } else l = e; });
    if (l) res.push(l);
  });
  return res;
}
function dessinerCitation(texte, ls, n) {
  var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  var x = c.getContext('2d');
  var g = x.createLinearGradient(0, 0, W * .4, H); g.addColorStop(0, '#0A6447'); g.addColorStop(.6, '#063D2C'); g.addColorStop(1, '#03251B');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  var halo = x.createRadialGradient(W * .9, 0, 0, W * .9, 0, W * .8); halo.addColorStop(0, 'rgba(242,183,5,.32)'); halo.addColorStop(1, 'rgba(242,183,5,0)');
  x.fillStyle = halo; x.fillRect(0, 0, W, H);
  var halo2 = x.createRadialGradient(0, H * .75, 0, 0, H * .75, W * .6); halo2.addColorStop(0, 'rgba(192,57,43,.28)'); halo2.addColorStop(1, 'rgba(192,57,43,0)');
  x.fillStyle = halo2; x.fillRect(0, 0, W, H);
  // Liseré aux couleurs APEL
  [['#1FB384', 0], ['#E2574A', 1], ['#F2B705', 2]].forEach(function (b) { x.fillStyle = b[0]; x.fillRect(90 + b[1] * 300, 0, 300, 12); });
  x.fillStyle = 'rgba(255,211,77,.9)'; x.font = 'bold 260px Georgia, "Noto Serif", serif'; x.fillText('“', 70, 330);
  var t = texte.replace(/[ \t]+/g, ' ').trim();
  if (t.length > 420) t = t.slice(0, 410).replace(/\s+\S*$/, '') + '…';
  var taille = t.length < 90 ? 66 : t.length < 180 ? 54 : t.length < 300 ? 46 : 40, ls2;
  do { x.font = 'italic ' + taille + 'px Georgia, "Noto Serif", serif'; ls2 = lignes(x, t, W - 200); taille -= 2; } while (ls2.length * taille * 1.45 > 760 && taille > 28);
  taille += 2;
  var y = 400; x.fillStyle = '#FFFFFF';
  ls2.forEach(function (l) { x.fillText(l, 100, y); y += taille * 1.45; });
  y += 30; x.fillStyle = '#FFD34D'; x.fillRect(100, y, 90, 5); y += 64;
  x.font = 'bold 44px "Inter APEL", system-ui, sans-serif'; x.fillStyle = '#FFFFFF';
  lignes(x, ls.titre, W - 200).slice(0, 2).forEach(function (l) { x.fillText(l, 100, y); y += 54; });
  x.font = '36px "Inter APEL", system-ui, sans-serif'; x.fillStyle = 'rgba(255,255,255,.85)';
  x.fillText([ls.auteur, tx('chapitre', { n: n })].filter(Boolean).join(' · '), 100, y + 4);
  // Logo APEL en bas à droite
  var logo = document.querySelector('img[src*="logo-plume"]') || chargerLogo.img;
  if (logo && logo.complete && logo.naturalWidth) { var h = 150, w = h * logo.naturalWidth / logo.naturalHeight; x.globalAlpha = .9; x.drawImage(logo, W - 100 - w, H - 100 - h, w, h); x.globalAlpha = 1; }
  x.font = 'bold 30px "Inter APEL", system-ui, sans-serif'; x.fillStyle = '#FFD34D'; x.fillText(tx('citationPied'), 100, H - 120);
  x.font = '30px "Inter APEL", system-ui, sans-serif'; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText('apel-offres.pages.dev', 100, H - 72);
  return c;
}
function chargerLogo() { if (!chargerLogo.img) { chargerLogo.img = new Image(); chargerLogo.img.src = 'assets/logo-plume.webp'; } }
chargerLogo();
function texteDe(p) { return (p.innerText || p.textContent || '').trim(); }
function ouvrirCitation(texte, id, n) {
  var ls = O.livreSalon(id);
  if (!ls) return;
  var canvas = dessinerCitation(texte, ls, n);
  var url = canvas.toDataURL('image/png'), nom = 'citation-' + id + '-' + n + '.png';
  var adresse = location.origin + location.pathname + '?src=citation#/lire/' + encodeURIComponent(id) + '/' + n;
  var msg = '« ' + texte.slice(0, 600) + ' »\n— ' + ls.titre + (ls.auteur ? ', ' + ls.auteur : '') + '\n\n' + tx('citationPied') + ' : ' + adresse;
  var dejaFavori = favoris.some(function (f) { return f.livre === id && f.n === n && f.texte === texte; });
  var v = feuille('<h2 id="titre-citation">' + esc(tx('citation')) + '</h2><img class="sl-apercu" src="' + url + '" alt="' + esc(tx('citationAlt')) + '" width="1080" height="1350"><div class="pile" style="margin-top:12px">' +
    '<button type="button" class="btn btn-primaire" data-sl="partager-image">' + svg('partage') + esc(tx('citationPartager')) + '</button>' +
    (dejaFavori ? '' : '<button type="button" class="btn btn-verre" data-sl="garder">♡ ' + esc(tx('garderPassage')) + '</button>') +
    '<a class="btn btn-verre" href="' + url + '" download="' + esc(nom) + '">' + esc(tx('citationTelecharger')) + '</a>' +
    '<a class="btn btn-verre" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">' + svg('wa') + esc(tx('citationWa')) + '</a>' +
    '<button type="button" class="btn btn-verre" data-fermer>' + esc(tx('fermer')) + '</button></div>');
  v.querySelector('.feuille').setAttribute('aria-labelledby', 'titre-citation');
  gagner('citation');
  var bg = v.querySelector('[data-sl="garder"]');
  if (bg) bg.addEventListener('click', function () {
    favoris = [{ livre: id, n: n, texte: texte, t: Date.now() }].concat(favoris); sauverFavoris();
    bg.remove(); O.message(tx('passageGarde')); vibrer();
  });
  var bp = v.querySelector('[data-sl="partager-image"]');
  bp.addEventListener('click', function () {
    canvas.toBlob(function (blob) {
      var f = window.File && blob ? new File([blob], nom, { type: 'image/png' }) : null;
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], text: msg }).catch(function () {});
      else if (navigator.share) navigator.share({ text: msg }).catch(function () {});
      else window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    }, 'image/png');
  });
  bp.focus();
}

/* ---------- Petite fête : quelques emojis qui s'envolent ---------- */
function feuxDArtifice(e) {
  if (CALME) return;
  for (var i = 0; i < 14; i++) {
    var s = document.createElement('span'); s.className = 'sl-fete'; s.textContent = e; s.setAttribute('aria-hidden', 'true');
    s.style.left = (10 + Math.random() * 80) + 'vw'; s.style.animationDelay = (Math.random() * .4) + 's'; s.style.fontSize = (18 + Math.random() * 18) + 'px';
    document.body.appendChild(s);
    setTimeout(function (x) { return function () { x.remove(); }; }(s), 2200);
  }
}

/* ---------- Clics et saisies ---------- */
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-sl]');
  if (!b) {
    // Paragraphe touché dans la liseuse : carte-citation ou passage favori.
    var p = e.target.closest('.liseuse:not(.sl-apercu-texte) .sl-texte p[data-para]');
    if (p && !e.target.closest('a') && !(window.getSelection && String(window.getSelection()).length > 1)) {
      var avant = document.querySelector('.sl-texte p.choisi');
      if (avant && avant !== p) avant.classList.remove('choisi');
      var bt = document.getElementById('sl-citer');
      if (p.classList.contains('choisi')) { p.classList.remove('choisi'); if (bt) bt.hidden = true; return; }
      p.classList.add('choisi');
      if (!bt) { bt = document.createElement('button'); bt.type = 'button'; bt.id = 'sl-citer'; bt.className = 'btn btn-primaire'; bt.setAttribute('data-sl', 'citer'); document.body.appendChild(bt); }
      bt.innerHTML = '✨ <span>' + esc(tx('citationCreer')) + '</span>';
      bt.hidden = false;
    }
    return;
  }
  var a = b.getAttribute('data-sl'), v = b.getAttribute('data-val'), r = O.route();
  switch (a) {
    case 'debloquer': feuilleDeblocage(); break;
    case 'code': feuilleDeblocage(''); break;
    case 'citer': { var ch = document.querySelector('.sl-texte p.choisi'); b.hidden = true; if (ch) { ch.classList.remove('choisi'); ouvrirCitation(texteDe(ch), r.args[0], +r.args[1]); } break; }
    case 'plus': case 'moins': prefs.taille = Math.max(15, Math.min(28, prefs.taille + (a === 'plus' ? 1 : -1))); appliquerPrefs(); break;
    case 'pref': prefs[b.getAttribute('data-pref')] = v; appliquerPrefs(); vibrer(6); break;
    case 'theme': prefs.theme = v; appliquerPrefs(); break;
    case 'reglages': feuilleReglages(); break;
    case 'marque': poserMarque(); break;
    case 'immersif': if (feuilleOuverte) feuilleOuverte.fermer(true); basculerImmersif(); if (r.nom !== 'lire' || r.args.length < 2) { var der = enCours()[0]; if (der) location.hash = '#/lire/' + encodeURIComponent(der) + '/' + lu[der].dernier; } break;
    case 'reessayer': delete chapitres[v]; O.afficher(true); break;
    case 'genre': genre = v; [].forEach.call(document.querySelectorAll('[data-sl="genre"]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); document.getElementById('sl-liste').innerHTML = listeLivres(); break;
    case 'video': ouvrirVideo(v); break;
    case 'suppr-marque': marques.splice(+v, 1); sauverMarques(); O.afficher(true); break;
    case 'aller-marque': { var m = marques[+v]; if (m) { var l = lu[m.livre] = lu[m.livre] || { chap: {} }; l.pos = { n: m.n, r: m.r }; ecrireJ('apel-lu', lu); } break; }
    case 'suppr-favori': favoris.splice(+v, 1); sauverFavoris(); O.afficher(true); break;
    case 'carte-favori': { var f = favoris[+v]; if (f) ouvrirCitation(f.texte, f.livre, f.n); break; }
    case 'reagir': {
      var dejaMoi = b.getAttribute('aria-pressed') === 'true';
      vibrer(10);
      appel('', { action: 'reagir', livre: r.args[0], n: +r.args[1], emoji: dejaMoi ? '' : v, appareil: appareil() }).then(function (d) {
        var z = document.getElementById('sl-emojis'); if (z) z.innerHTML = emojis(d);
        if (!dejaMoi) { gagner('avis'); var em = EMOJIS.filter(function (x) { return x[0] === v; })[0]; if (em) feuxDArtifice(em[1]); }
      }, function (er) { O.message(er.message); });
      break;
    }
  }
});
document.addEventListener('input', function (e) {
  if (e.target.id === 'sl-cherche') { recherche = e.target.value; var z = document.getElementById('sl-liste'); if (z) z.innerHTML = listeLivres(); }
  if (e.target.hasAttribute && e.target.hasAttribute('data-sl-taille')) { prefs.taille = +e.target.value; appliquerPrefs(); }
});
document.addEventListener('change', function (e) {
  if (e.target.hasAttribute && e.target.hasAttribute('data-sl-allume')) { prefs.allume = e.target.checked; sauverPrefs(); if (prefs.allume && document.querySelector('.sl-texte')) garderEcranAllume(); else if (!prefs.allume) libererEcran(); }
});
// En changeant de page : bouton de citation caché, feuille fermée, fin du mode lecture hors chapitre.
window.addEventListener('hashchange', function () {
  var bt = document.getElementById('sl-citer'); if (bt) bt.hidden = true;
  if (feuilleOuverte) feuilleOuverte.fermer(true);
  var r = O.route();
  if (!(r.nom === 'lire' && r.args.length > 1)) quitterLecture();
  else appliquerFond();
});

/* ---------- Styles du Salon et de la liseuse ---------- */
var css = document.createElement('style');
css.textContent = [
  '.sl-bascule{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;margin:6px 0 14px;border-radius:999px;background:rgba(0,0,0,.28);box-shadow:inset 0 1px 2px rgba(0,0,0,.4)}',
  '.sl-bascule a{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;border-radius:999px;text-decoration:none;color:var(--texte-2);font-weight:800;font-size:15px;transition:color .3s ease}',
  '.sl-bascule a[aria-selected="true"]{color:var(--encre)}',
  '.sl-bascule-bulle{position:absolute;z-index:0;top:4px;bottom:4px;left:4px;width:calc(50% - 6px);border-radius:999px;background:radial-gradient(120% 90% at 50% -10%,rgba(255,255,255,.7),rgba(255,255,255,0) 55%),linear-gradient(180deg,var(--jaune-clair),var(--jaune) 55%,var(--jaune-fonce));box-shadow:0 4px 12px -4px rgba(242,183,5,.7);transition:transform .45s cubic-bezier(.2,.9,.25,1.15)}',
  '.sl-bascule a:nth-child(2)[aria-selected="true"]~.sl-bascule-bulle{transform:translateX(calc(100% + 4px))}',
  '.sl-actions{display:grid;grid-template-columns:1.4fr 1fr;gap:8px;margin:4px 0 14px}',
  '.sl-actions .btn{min-height:50px;padding:10px 12px;font-size:15px}',
  '.sl-actions-petites{display:flex;gap:8px;flex-wrap:wrap}.sl-actions-petites .btn{min-height:40px;padding:8px 14px;font-size:14px}',
  '.sl-pass{display:flex;gap:12px;align-items:center;padding:14px 16px;margin:4px 0 14px}',
  '.sl-pass b{display:block}.sl-pass span span{display:block;font-size:14px;color:var(--texte-2)}',
  '.sl-pass-ic{width:40px;height:40px;flex:none;border-radius:50%;display:grid;place-items:center;font-weight:800;color:#fff;background:radial-gradient(circle at 32% 24%,rgba(255,255,255,.8) 0 6%,rgba(255,255,255,0) 32%),radial-gradient(circle at 45% 40%,#2BC795,#0A5E43 80%)}',
  '.sl-reprise{display:flex;align-items:center;gap:14px;padding:12px 14px;margin:0 0 12px;text-decoration:none;color:var(--texte)}',
  '.sl-couv{display:block;flex:none}',
  '.sl-reprise .sl-couv{width:46px}.sl-reprise small{display:block;color:var(--jaune-clair);font-weight:800;font-size:12px;letter-spacing:.06em;text-transform:uppercase}',
  '.sl-reprise>span:nth-child(2){flex:1;min-width:0}.sl-reprise b{display:block}.sl-reprise span span{display:block;font-size:14px;color:var(--texte-2)}.sl-reprise .fl{margin-left:auto}',
  '.sl-liste{display:grid;gap:12px}',
  '.sl-livre{display:flex;gap:14px;padding:14px;text-decoration:none;color:var(--texte);align-items:flex-start}',
  '.sl-livre .sl-couv{width:84px}',
  '.sl-infos{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}.sl-infos .badge{align-self:flex-start;margin:0 0 2px}',
  '.sl-infos b{font-size:17px;line-height:1.25}.sl-infos>span{color:var(--texte-2);font-size:14px}.sl-infos small{color:var(--texte-2);font-size:13px}',
  '.sl-barre{display:block;height:6px;border-radius:9px;margin-top:8px;background:rgba(0,0,0,.3);overflow:hidden}.sl-barre i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,var(--vert-vif),var(--jaune),var(--rouge-clair))}',
  '.sl-cherche{width:100%;min-height:48px;border:0;border-radius:999px;padding:10px 18px;margin:0 0 10px;font:inherit;color:var(--encre);background:#fff;box-shadow:0 8px 20px -14px rgba(0,0,0,.8)}',
  '.sl-genres{display:flex;gap:6px;overflow-x:auto;margin:0 -16px 12px;padding:2px 16px 4px;scrollbar-width:none}',
  '.sl-genres button{flex:none;border:0;border-radius:999px;padding:8px 14px;min-height:40px;font-weight:700;font-size:14px;cursor:pointer;color:var(--texte);background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}',
  '.sl-genres button[aria-pressed="true"]{color:var(--encre);background:linear-gradient(180deg,var(--jaune-clair),var(--jaune))}',
  '.sl-videos{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -16px;padding:4px 16px 14px;scrollbar-width:none}',
  '.sl-video{position:relative;flex:0 0 124px;height:220px;border:0;border-radius:18px;overflow:hidden;scroll-snap-align:start;cursor:pointer;padding:0;color:#fff;text-align:left;',
  '  background:radial-gradient(80% 60% at 80% 0%,rgba(242,183,5,.35),rgba(242,183,5,0)),radial-gradient(80% 60% at 0% 100%,rgba(192,57,43,.4),rgba(192,57,43,0)),linear-gradient(165deg,#0A6447,#03251B);',
  '  box-shadow:0 16px 26px -14px rgba(0,0,0,.9),inset 0 0 0 1px rgba(255,255,255,.18);transform:perspective(700px) rotateY(var(--ry,0deg));transition:transform .3s ease}',
  '.sl-video.horizontale{flex-basis:220px}',
  '.sl-video img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
  '.sl-video::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 45%,rgba(0,0,0,.8))}',
  '.sl-video b{position:absolute;z-index:1;left:10px;right:10px;bottom:10px;font-size:13.5px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
  '.sl-lecture{position:absolute;z-index:1;top:50%;left:50%;width:48px;height:48px;margin:-34px 0 0 -24px;border-radius:50%;display:grid;place-items:center;color:var(--encre);background:linear-gradient(180deg,var(--jaune-clair),var(--jaune));box-shadow:0 6px 16px -4px rgba(0,0,0,.7)}',
  '.sl-lecture svg{width:22px;height:22px;margin-left:3px}',
  '.sl-video:active{transform:scale(.96)}',
  '.voile-video .feuille{background:#050505}',
  '.sl-ecran{position:relative;width:100%;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000}',
  '.sl-ecran.vertical{aspect-ratio:9/16;max-height:62vh;width:auto;margin:0 auto}',
  '.sl-ecran video,.sl-ecran iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}',
  '.sl-carnet{margin-top:22px}.sl-carnet h2{margin-bottom:12px}',
  '.sl-flamme{display:flex;gap:12px;align-items:center;padding:12px;border-radius:18px;background:rgba(0,0,0,.18);margin-bottom:12px}',
  '.sl-flamme b{display:block}.sl-flamme span span{display:block;font-size:14px;color:var(--texte-2)}',
  '.sl-feu{font-size:34px;line-height:1;filter:grayscale(.6)}.allumee .sl-feu{filter:none;animation:sl-danse 1.6s ease-in-out infinite alternate}',
  '@keyframes sl-danse{from{transform:scale(1) rotate(-4deg)}to{transform:scale(1.12) rotate(4deg)}}',
  '.sl-badges{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}',
  '.sl-badges li{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:10px 6px;border-radius:16px;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);opacity:.55}',
  '.sl-badges li>span:first-child{font-size:28px;filter:grayscale(1)}.sl-badges b{font-size:12.5px;line-height:1.2}.sl-badges small{font-size:11px;color:var(--texte-2);line-height:1.25}',
  '.sl-badges li.gagne{opacity:1;background:linear-gradient(135deg,rgba(242,183,5,.22),rgba(242,183,5,.05));box-shadow:inset 0 0 0 1px rgba(242,183,5,.55);animation:sl-badge 3s ease-in-out infinite}',
  '.sl-badges li.gagne>span:first-child{filter:none}',
  '@keyframes sl-badge{0%,100%{transform:perspective(400px) rotateY(0)}50%{transform:perspective(400px) rotateY(12deg)}}',
  '.sl-entete{display:flex;gap:16px;align-items:flex-start}.sl-entete-couv{width:110px;flex:none;animation:sl-couv-3d .8s cubic-bezier(.2,.8,.2,1) both}',
  '@keyframes sl-couv-3d{from{transform:perspective(600px) rotateY(-70deg);opacity:0}to{transform:perspective(600px) rotateY(-12deg);opacity:1}}',
  '.sl-offert{font-size:13px;font-weight:800;color:var(--vert-vif);background:rgba(31,179,132,.14);border-radius:999px;padding:3px 10px;white-space:nowrap}',
  '.sl-lu{font-size:13px;font-weight:700;color:var(--texte-2);white-space:nowrap}',
  '.sl-sommaire a{gap:12px}.sl-sommaire a.ferme b{color:var(--texte-2)}.sl-sommaire .badge{margin:0;white-space:nowrap}',
  '.sl-num{width:32px;height:32px;flex:none;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;color:var(--encre);background:linear-gradient(180deg,var(--jaune-clair),var(--jaune))}',
  '.ferme .sl-num{background:rgba(255,255,255,.12);color:var(--texte-2)}',
  '.sl-notes li{position:relative}.sl-notes a{padding-right:52px!important}.sl-note-ic{font-size:22px;flex:none}.sl-notes a>span:nth-child(2){min-width:0}',
  '.sl-notes a span span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-style:italic}',
  '.sl-suppr{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:40px;height:40px;border:0;border-radius:50%;cursor:pointer;font-size:22px;color:var(--texte-2);background:rgba(255,255,255,.08)}',
  '.sl-favoris{list-style:none;margin:0;padding:0;display:grid;gap:10px}.sl-favoris li{padding:16px}',
  '.sl-favoris blockquote{margin:0 0 8px;font-family:Georgia,"Noto Serif",serif;font-style:italic;font-size:16px;line-height:1.55}.sl-favoris p{font-size:13px;color:var(--jaune-clair);font-weight:700}',
  '.sl-vide{margin:0 4px}',
  // Réglages
  '.sl-etiq{font-weight:800;font-size:14px;margin:14px 0 8px}.sl-reglages>.sl-etiq:first-child{margin-top:0}',
  '.sl-themes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}',
  '.sl-pastille{display:flex;flex-direction:column;align-items:center;gap:2px;min-height:68px;padding:8px 4px;border:0;border-radius:16px;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(127,127,127,.4);transition:transform .2s ease}',
  '.sl-pastille span{font-family:Georgia,serif;font-size:22px;font-weight:700}.sl-pastille small{font-size:11.5px;font-weight:700}',
  '.sl-pastille[aria-pressed="true"]{box-shadow:inset 0 0 0 3px var(--jaune),0 6px 14px -6px rgba(242,183,5,.8);transform:translateY(-2px)}',
  '.sl-jour{background:#FFFFFF;color:#1F2A37}.sl-sepia{background:#F4ECD8;color:#3B2F20}.sl-sombre{background:#141414;color:#E8E2D6}.sl-nuit{background:#063D2C;color:#fff}',
  '.sl-taille{display:grid;grid-template-columns:48px 1fr 48px;gap:10px;align-items:center}',
  '.sl-taille button,.sl-choix button{min-height:44px;border:0;border-radius:14px;cursor:pointer;font-weight:800;color:inherit;background:rgba(127,127,127,.18)}',
  '.sl-taille input{width:100%;accent-color:var(--jaune)}',
  '.sl-choix{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
  '.sl-choix button[aria-pressed="true"]{color:var(--encre);background:linear-gradient(180deg,var(--jaune-clair),var(--jaune))}',
  '.sl-choix .sl-po-serif{font-family:Georgia,"Noto Serif",serif}.sl-choix .sl-po-sans{font-family:var(--police)}.sl-choix .sl-po-lisible{font-family:Verdana,Tahoma,"Noto Sans",sans-serif;letter-spacing:.02em}',
  '.sl-case{display:flex;gap:10px;align-items:center;margin:14px 0 0;font-weight:700;font-size:15px}.sl-case input{width:22px;height:22px;accent-color:var(--jaune)}',
  '.sl-apercu-texte{margin:14px 0 0!important;padding:14px 16px!important;border-radius:16px;box-shadow:inset 0 0 0 1px rgba(127,127,127,.3)}',
  '.sl-apercu-texte .sl-texte{margin:0;text-indent:0;cursor:default}',
  // Liseuse
  '.sl-progres{position:fixed;top:0;left:0;right:0;height:4px;z-index:35;background:rgba(0,0,0,.25)}.sl-progres i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--vert-vif),var(--jaune),var(--rouge-clair));transition:width .15s linear}',
  '.liseuse{--sl-encre:#fff;--sl-doux:rgba(255,255,255,.82);--sl-fond:#063D2C;color:var(--sl-encre);transition:color .3s ease}',
  '.sl-th-jour{--sl-fond:#F7F7F4;--sl-encre:#1F2A37;--sl-doux:#4B5563}.sl-th-sepia{--sl-fond:#F2E8D2;--sl-encre:#3B2F20;--sl-doux:#6B5A43}.sl-th-sombre{--sl-fond:#121212;--sl-encre:#E6E0D4;--sl-doux:#A8A196}',
  '.sl-apercu-texte{background:var(--sl-fond)}',
  'html[data-liseuse] .decor{transition:background .4s ease}',
  'html[data-liseuse="jour"] .decor{background:#F7F7F4}html[data-liseuse="sepia"] .decor{background:#F2E8D2}html[data-liseuse="sombre"] .decor{background:#121212}',
  'html[data-liseuse="jour"],html[data-liseuse="sepia"]{background:#F2E8D2;color-scheme:light}html[data-liseuse="sombre"]{background:#121212}',
  'html[data-liseuse="jour"] .pied,html[data-liseuse="sepia"] .pied{color:#6B5A43}html[data-liseuse="jour"] .pied a,html[data-liseuse="sepia"] .pied a{color:#6B5A43!important}',
  '.sl-haut{position:sticky;top:64px;z-index:15;display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 -8px;padding:6px 8px;border-radius:999px;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .35s ease}',
  '.sl-haut.cachee{transform:translateY(-150%);opacity:0;pointer-events:none}',
  '.sl-haut .retour{margin:0;max-width:calc(100% - 156px);overflow:hidden;white-space:nowrap}.sl-haut .retour span{overflow:hidden;text-overflow:ellipsis}',
  '.sl-th-jour .retour,.sl-th-sepia .retour{background:rgba(0,0,0,.07);box-shadow:none;color:var(--sl-encre)}.sl-th-jour .retour::after,.sl-th-sepia .retour::after{display:none}',
  '.sl-outils{display:flex;gap:6px;align-items:center}.sl-outils button{display:grid;place-items:center;min-width:44px;min-height:44px;border:0;border-radius:50%;background:rgba(127,127,127,.22);color:var(--sl-encre);font-weight:800;font-family:Georgia,serif;font-size:17px;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}',
  '.sl-outils button[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--jaune)}.sl-outils button:active{transform:scale(.9)}',
  '.sl-surtitre{margin:26px 0 4px;text-align:center;font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--jaune-fonce)}',
  '.sl-th-nuit .sl-surtitre,.sl-th-sombre .sl-surtitre{color:var(--jaune-clair)}',
  '.sl-titre{text-align:center;font-family:Georgia,"Noto Serif",serif;font-weight:700;font-size:28px;margin:0 0 6px}',
  '.sl-restant{text-align:center;font-size:13px;color:var(--sl-doux);margin:0 0 24px}',
  '.sl-texte{font-family:Georgia,"Noto Serif","Times New Roman",serif;font-size:var(--sl-taille,19px);line-height:var(--sl-interligne,1.7);hyphens:auto;-webkit-hyphens:auto}',
  '.sl-po-sans .sl-texte{font-family:var(--police)}.sl-po-lisible .sl-texte{font-family:Verdana,Tahoma,"Noto Sans",sans-serif;letter-spacing:.02em;word-spacing:.08em;hyphens:none;-webkit-hyphens:none}',
  '.sl-texte p{margin:0 0 .9em;text-indent:1.4em;border-radius:8px;transition:background .2s ease;cursor:pointer}',
  '.sl-texte p.sl-c{text-align:center;text-indent:0}.sl-texte p.sl-q{margin-left:1.2em;margin-right:.6em;text-indent:0;font-style:italic;color:var(--sl-doux)}.sl-texte p.sl-vers{text-indent:0;margin-left:.6em}',
  '.sl-texte h3{font-size:1.1em;margin:1.4em 0 .6em;text-align:center}.sl-sep{text-align:center;letter-spacing:.4em;color:var(--sl-doux);margin:1.2em 0;text-indent:0!important}',
  '.sl-texte p.choisi{background:rgba(242,183,5,.25);box-shadow:0 0 0 6px rgba(242,183,5,.25)}',
  '#sl-citer{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:36;box-shadow:0 14px 30px -10px rgba(0,0,0,.7);animation:toast-entre .35s cubic-bezier(.2,.9,.3,1.35) both}',
  '#sl-quitter{position:fixed;right:12px;top:12px;top:calc(12px + env(safe-area-inset-top));z-index:36;min-height:42px;padding:8px 14px;font-size:14px;transition:opacity .3s ease,transform .3s ease}',
  '.outils-caches #sl-quitter{opacity:0;transform:translateY(-140%);pointer-events:none}',
  '.immersif .entete{transform:translateY(-120%);opacity:0;pointer-events:none}.entete{transition:transform .4s cubic-bezier(.2,.8,.2,1),opacity .4s ease}',
  '.immersif .sl-haut{top:8px}.immersif .pied{display:none}',
  '.sl-astuce{font-size:13px;color:var(--sl-doux);text-align:center;margin:18px 0}',
  '.sl-reactions{text-align:center;margin:10px 0 18px}.sl-reactions p{font-weight:700;margin:0 0 10px}',
  '#sl-emojis{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}',
  '#sl-emojis button{display:flex;flex-direction:column;align-items:center;min-width:56px;min-height:56px;padding:6px 8px;border:0;border-radius:18px;cursor:pointer;background:rgba(127,127,127,.15);color:var(--sl-encre);transition:transform .2s cubic-bezier(.2,.9,.3,1.5)}',
  '#sl-emojis button span{font-size:24px;line-height:1.2}#sl-emojis button small{font-size:12px;font-weight:700;min-height:14px}',
  '#sl-emojis button[aria-pressed="true"]{background:rgba(242,183,5,.3);box-shadow:inset 0 0 0 2px var(--jaune);transform:scale(1.08)}#sl-emojis button:active{transform:scale(.88)}',
  '.liseuse .btn{margin-top:10px}',
  '.sl-th-jour .btn-verre,.sl-th-sepia .btn-verre{background:rgba(0,0,0,.07);color:var(--sl-encre);box-shadow:none}.sl-th-jour .btn-verre::after,.sl-th-sepia .btn-verre::after{display:none}',
  '.sl-suite{margin:18px 0 6px;padding:20px 16px;border-radius:22px;text-align:center;background:linear-gradient(135deg,rgba(242,183,5,.18),rgba(242,183,5,.04));box-shadow:inset 0 0 0 1px rgba(242,183,5,.45)}',
  '.sl-suite-ic{font-size:36px;display:block;margin-bottom:6px;animation:sl-cadenas 2.4s ease-in-out infinite}.sl-suite h2{margin-bottom:8px}.sl-suite p{color:var(--sl-doux,var(--texte-2))}.sl-suite .sl-actions{margin-bottom:0}',
  '@keyframes sl-cadenas{0%,100%{transform:perspective(300px) rotateY(0)}50%{transform:perspective(300px) rotateY(180deg)}}',
  '.sl-formules{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0}',
  '.sl-formule{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 6px;text-align:center;text-decoration:none;color:var(--texte);transition:transform .2s ease}',
  '.sl-formule:nth-child(1){box-shadow:var(--relief),inset 0 3px 0 var(--vert-vif)}.sl-formule:nth-child(2){box-shadow:var(--relief),inset 0 3px 0 var(--jaune)}.sl-formule:nth-child(3){box-shadow:var(--relief),inset 0 3px 0 var(--rouge-clair)}',
  '.sl-formule b{font-size:15px}.sl-formule>span{font-size:13px;color:var(--jaune-clair);font-weight:700}.sl-formule em{font-style:normal;display:flex;gap:4px;align-items:center;font-size:12.5px;font-weight:800;margin-top:4px;color:var(--texte-2)}.sl-formule em svg{width:15px;height:15px}',
  '.sl-formule:active{transform:perspective(500px) rotateX(12deg) scale(.96)}',
  '.sl-code label{display:block;font-weight:700;margin:6px 0 6px}',
  '.sl-code input{width:100%;min-height:52px;border-radius:16px;border:0;padding:12px 16px;font:inherit;font-size:20px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;text-align:center;color:var(--encre);background:#fff;margin-bottom:10px}',
  '.sl-erreur{color:#FFD0CA;background:rgba(192,57,43,.3);border-radius:12px;padding:8px 12px;font-size:14px}',
  '.feuille{max-height:calc(100vh - 24px);overflow-y:auto}',
  '.voile-leger{background:rgba(1,16,11,.25)}',
  '.feuille.secoue{animation:sl-secoue .45s ease}@keyframes sl-secoue{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}',
  '.sl-apercu{width:100%;max-width:300px;margin:0 auto;border-radius:14px;box-shadow:0 14px 30px -12px rgba(0,0,0,.8);animation:sl-carte .7s cubic-bezier(.2,.9,.25,1.1) both}',
  '@keyframes sl-carte{from{transform:perspective(800px) rotateY(-80deg) scale(.9);opacity:0}to{transform:none;opacity:1}}',
  '.sl-fete{position:fixed;bottom:-40px;z-index:60;pointer-events:none;animation:sl-envol 2s ease-out forwards}',
  '@keyframes sl-envol{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(-85vh) rotate(40deg);opacity:0}}',
  '@media (max-width:360px){.sl-formules{grid-template-columns:1fr}.sl-actions{grid-template-columns:1fr}.sl-entete-couv{width:84px}.sl-themes{grid-template-columns:repeat(2,minmax(0,1fr))}}',
  '@media (prefers-reduced-motion:reduce){.allumee .sl-feu,.sl-badges li.gagne,.sl-suite-ic,.sl-entete-couv{animation:none}}'
].join('\n');
document.head.appendChild(css);

/* ---------- Points d'entrée appelés par index.html ---------- */
window.APEL_LECTURE = {
  vue: function (args) {
    var html;
    if (!args[0]) html = vueSalon();
    else if (!etat.salon) html = squelette();
    else { var n = parseInt(args[1], 10); html = n >= 1 ? vueChapitre(args[0], n) : vueLivre(args[0]); }
    setTimeout(appliquerFond, 0);
    return html;
  },
  liseuse: function () { setTimeout(appliquerFond, 0); return vueLiseuse(); }
};
})();
