/* Salon de lecture d'APEL Éditions : livres à lire en ligne, chapitre par chapitre.
   Chargé par index.html à la première visite de #/lire. Les textes arrivent de /api/lecture.
   - Premiers chapitres offerts ; la suite avec un code de lecture (24 h, semaine, mois ou promo) reçu sur WhatsApp.
   - Carnet de lecture : flamme des jours de lecture d'affilée et badges, gardés dans le téléphone.
   - Réactions par chapitre et cartes-citations à partager en statut WhatsApp. */
(function () {
'use strict';
var O = window.APEL_OUTILS;
if (!O) return;
var etat = O.etat, esc = O.esc, svg = O.svg;
var API = 'api/lecture';

/* ---------- Textes ---------- */
var TX = {
  fr: {
    titre: 'Le Salon de lecture', intro: 'Des romans à lire ici, chapitre par chapitre. Les premiers chapitres sont offerts.',
    vide: 'Les premiers livres arrivent très bientôt dans le Salon. Revenez vite !',
    indispo: 'Le Salon de lecture ouvre bientôt. Écrivez-nous sur WhatsApp pour être prévenu.',
    abonne: 'Lecture débloquée', jusqua: 'jusqu’au {d}', debloquer: 'Débloquer tous les chapitres', jaiCode: 'J’ai un code',
    reprendre: 'Reprendre ma lecture', chapitre: 'Chapitre {n}', chapitres: '{n} chapitres', unChapitre: '1 chapitre', min: '{n} min',
    commencer: 'Commencer la lecture', continuer: 'Continuer : chapitre {n}', relire: 'Relire depuis le début',
    sommaire: 'Sommaire', offert: 'Offert', nouveau: 'Nouveau', lu: 'Lu', verrou: 'Réservé aux abonnés',
    suivant: 'Chapitre suivant', precedent: 'Chapitre précédent', finLivre: 'Fin du livre… pour l’instant !', finLivreD: 'Vous avez tout lu. Dites à l’auteur ce que vous en avez pensé, ou partagez le livre à un ami.',
    donnerAvis: 'Donner mon avis sur WhatsApp', msgAvis: 'Je viens de finir « {t} » dans le Salon de lecture. Mon avis : ',
    laSuite: 'La suite vous attend', laSuiteD: 'Débloquez tous les chapitres de tous les livres du Salon avec un code de lecture, reçu sur WhatsApp en quelques minutes.',
    reactions: 'Ce chapitre vous a fait…', coeur: 'J’adore', rire: 'Rire', choc: 'Choc', larme: 'Ému', feu: 'Captivant',
    partagerChap: 'Partager ce chapitre', astuce: 'Astuce : touchez un paragraphe pour en faire une carte-citation.',
    taille: 'Taille du texte', theme: 'Couleur de la page', nuit: 'Nuit', sepia: 'Sépia', jour: 'Jour',
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
    citation: 'Carte-citation', citationCreer: 'Créer une carte-citation', citationPartager: 'Partager l’image', citationTelecharger: 'Enregistrer l’image',
    citationWa: 'Envoyer le texte sur WhatsApp', citationPied: 'Lu dans le Salon de lecture d’APEL Éditions', citationAlt: 'Carte-citation à partager',
    erreur: 'Une erreur est survenue. Réessayez.', chargement: 'Chargement…', retourSalon: 'Salon', introuvable: 'Ce livre n’est plus dans le Salon.'
  },
  en: {
    titre: 'The Reading Lounge', intro: 'Novels to read right here, chapter by chapter. The first chapters are free.',
    vide: 'The first books are arriving in the Lounge very soon. Come back soon!',
    indispo: 'The Reading Lounge opens soon. Message us on WhatsApp to be told when.',
    abonne: 'Reading unlocked', jusqua: 'until {d}', debloquer: 'Unlock every chapter', jaiCode: 'I have a code',
    reprendre: 'Continue reading', chapitre: 'Chapter {n}', chapitres: '{n} chapters', unChapitre: '1 chapter', min: '{n} min',
    commencer: 'Start reading', continuer: 'Continue: chapter {n}', relire: 'Read again from the start',
    sommaire: 'Contents', offert: 'Free', nouveau: 'New', lu: 'Read', verrou: 'Subscribers only',
    suivant: 'Next chapter', precedent: 'Previous chapter', finLivre: 'The end… for now!', finLivreD: 'You have read it all. Tell the author what you thought, or share the book with a friend.',
    donnerAvis: 'Give my opinion on WhatsApp', msgAvis: 'I have just finished “{t}” in the Reading Lounge. My opinion: ',
    laSuite: 'The rest is waiting for you', laSuiteD: 'Unlock every chapter of every book in the Lounge with a reading code, sent on WhatsApp within minutes.',
    reactions: 'This chapter made me…', coeur: 'Love it', rire: 'Laugh', choc: 'Shocked', larme: 'Moved', feu: 'Gripped',
    partagerChap: 'Share this chapter', astuce: 'Tip: tap a paragraph to turn it into a quote card.',
    taille: 'Text size', theme: 'Page colour', nuit: 'Night', sepia: 'Sepia', jour: 'Day',
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
    citation: 'Quote card', citationCreer: 'Create a quote card', citationPartager: 'Share the image', citationTelecharger: 'Save the image',
    citationWa: 'Send the text on WhatsApp', citationPied: 'Read in the APEL Éditions Reading Lounge', citationAlt: 'Quote card to share',
    erreur: 'Something went wrong. Please try again.', chargement: 'Loading…', retourSalon: 'Lounge', introuvable: 'This book is no longer in the Lounge.'
  }
};
function tx(k, v) { var s = (TX[etat.lang] && TX[etat.lang][k]) || TX.fr[k] || k; if (v) Object.keys(v).forEach(function (x) { s = s.split('{' + x + '}').join(v[x]); }); return s; }

var EMOJIS = [['coeur', '❤️'], ['rire', '😂'], ['choc', '😮'], ['larme', '😢'], ['feu', '🔥']];
var BADGES = [['premier', '📖'], ['flamme3', '🔥'], ['flamme7', '🏆'], ['nuit', '🦉'], ['matin', '🌅'], ['marathon', '⚡'], ['fin', '🏁'], ['explorateur', '🧭'], ['citation', '✨'], ['avis', '💬']];

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
var prefs = lireJ('apel-liseuse', { taille: 19, theme: 'nuit' });
var lu = lireJ('apel-lu', {});          // { livre: { dernier: n, chap: { n: 'AAAA-MM-JJ' } } }
var carnet = lireJ('apel-carnet', { jours: {}, badges: {} });   // jours : { 'AAAA-MM-JJ': nombre de chapitres }
if (!carnet.jours) carnet.jours = {};
if (!carnet.badges) carnet.badges = {};

function aujourdhui(d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function flamme() {
  var n = 0, d = new Date();
  if (!carnet.jours[aujourdhui(d)]) d.setDate(d.getDate() - 1); // la flamme tient jusqu'à ce soir minuit
  while (carnet.jours[aujourdhui(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function totalLus() { var n = 0; Object.keys(lu).forEach(function (k) { n += Object.keys(lu[k].chap || {}).length; }); return n; }
function gagner(b) {
  if (carnet.badges[b]) return;
  carnet.badges[b] = aujourdhui(); ecrireJ('apel-carnet', carnet);
  var e = BADGES.filter(function (x) { return x[0] === b; })[0];
  setTimeout(function () { O.message(tx('badgeGagne', { b: (e ? e[1] + ' ' : '') + tx('b_' + b) })); feuxDArtifice(e ? e[1] : '✨'); }, 400);
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
var chapitres = {}; // 'livre/n' → { ok: données } ou { verrou: true } ou { erreur }
function chargerChapitre(livre, n) {
  var k = livre + '/' + n;
  if (chapitres[k] && (chapitres[k].ok || chapitres[k].attente)) return;
  chapitres[k] = { attente: true };
  appel('action=chapitre&livre=' + encodeURIComponent(livre) + '&n=' + n).then(function (d) {
    chapitres[k] = { ok: d };
  }, function (e) {
    if (e.verrou && pass()) { O.stock('apel-pass', ''); O.message(tx('expire')); }
    chapitres[k] = e.verrou ? { verrou: true } : { erreur: e.message };
  }).then(function () { var r = O.route(); if (r.nom === 'lire' && r.args[0] === livre && +r.args[1] === n) O.afficher(true); });
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
function retourVers(href, libelle) { return '<a class="retour verre" href="' + href + '">' + svg('retour', 18) + esc(libelle) + '</a>'; }

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
  return '<a class="sl-livre verre" href="#/lire/' + encodeURIComponent(ls.id) + '">' + couverture(ls, 96) +
    '<span class="sl-infos">' + (neuf ? '<span class="badge">' + esc(tx('nouveau')) + '</span>' : '') + '<b lang="fr">' + esc(ls.titre) + '</b>' + (ls.auteur ? '<span>' + esc(ls.auteur) + '</span>' : '') +
    '<small>' + esc(nb > 1 ? tx('chapitres', { n: nb }) : tx('unChapitre')) + (O.offerts(ls) ? ' · ' + esc(O.offerts(ls)) : '') + '</small>' + (faits ? barre(faits / nb) : '') + '</span></a>';
}

/* ---------- Vues ---------- */
function vueSalon() {
  var s = etat.salon;
  if (!s) return '<p class="muet" aria-busy="true" style="margin:24px 4px">' + esc(tx('chargement')) + '</p>';
  if (etat.codeLien) setTimeout(function () { var c = etat.codeLien; etat.codeLien = ''; try { sessionStorage.removeItem('apel-code'); } catch (e) {} feuilleDeblocage(c); }, 0);
  var tete = O.retour() + '<h1 class="titre-page">' + esc(tx('titre')) + '</h1><p class="muet intro">' + esc(s.accueil || tx('intro')) + '</p>';
  if (!s.livres.length) return tete + '<div class="verre panneau"><p style="margin:0 0 12px">' + esc(tx(s.indisponible ? 'indispo' : 'vide')) + '</p>' + O.aWa([O.t('msgSalon')], O.t('ecrireWa'), 'btn-primaire btn-plein') + '</div>' + blocCarnet();
  // « Reprendre » : le dernier livre ouvert encore dans le Salon.
  var dernier = Object.keys(lu).filter(function (id) { return lu[id].dernier && O.livreSalon(id); }).sort(function (a, b) { return (lu[b].quand || 0) - (lu[a].quand || 0); })[0];
  var reprise = '';
  if (dernier) {
    var ld = O.livreSalon(dernier), n = lu[dernier].dernier;
    reprise = '<a class="sl-reprise verre" href="#/lire/' + encodeURIComponent(dernier) + '/' + n + '">' + couverture(ld, 60) + '<span><small>' + esc(tx('reprendre')) + '</small><b lang="fr">' + esc(ld.titre) + '</b><span>' + esc(tx('chapitre', { n: n })) + '</span></span><span class="fl">' + svg('fl', 18) + '</span></a>';
  }
  return tete + blocPass() + reprise + '<div class="sl-liste">' + s.livres.map(carteLivre).join('') + '</div>' + blocCarnet();
}

function vueLivre(id) {
  var ls = O.livreSalon(id);
  if (!ls) return etat.salon ? retourVers('#/lire', tx('retourSalon')) + '<p class="muet" style="margin:16px 4px">' + esc(tx('introuvable')) + '</p>' : '<p class="muet" aria-busy="true" style="margin:24px 4px">' + esc(tx('chargement')) + '</p>';
  var lus = chapLus(id), dernier = lu[id] && lu[id].dernier;
  var mots = ls.chapitres.reduce(function (s, c) { return s + (c.mots || 0); }, 0);
  var suite = dernier ? lien('#/lire/' + encodeURIComponent(id) + '/' + dernier, svg('ouvert') + '<span>' + esc(tx('continuer', { n: dernier })) + '</span>', 'btn btn-primaire btn-plein')
    : lien('#/lire/' + encodeURIComponent(id) + '/1', svg('ouvert') + '<span>' + esc(tx('commencer')) + '</span>', 'btn btn-primaire btn-plein');
  var liste = ls.chapitres.map(function (c) {
    var o = ouvert(ls, c.n), etiquette = lus[c.n] ? '<span class="sl-lu">✓ ' + esc(tx('lu')) + '</span>' : recent(c) ? '<span class="badge">' + esc(tx('nouveau')) + '</span>' : c.n <= ls.gratuits && !pass() ? '<span class="sl-offert">' + esc(tx('offert')) + '</span>' : '';
    return '<li><a href="#/lire/' + encodeURIComponent(id) + '/' + c.n + '"' + (o ? '' : ' class="ferme"') + '><span class="sl-num">' + c.n + '</span><span><b lang="fr">' + esc(c.titre || tx('chapitre', { n: c.n })) + '</b><span>' + esc(tx('min', { n: minutes(c.mots) })) + (o ? '' : ' · ' + esc(tx('verrou'))) + '</span></span>' + etiquette + (o ? '' : '<span class="fl">' + svg('cadenas', 18) + '</span>') + '</a></li>';
  }).join('');
  var faits = ls.chapitres.filter(function (c) { return lus[c.n]; }).length;
  return retourVers('#/lire', tx('retourSalon')) + '<article class="pile">' +
    '<div class="sl-entete"><div class="sl-entete-couv">' + couverture(ls, 132) + '</div><div><h1 class="titre-page" lang="fr" style="margin:0 0 6px">' + esc(ls.titre) + '</h1>' +
    '<p class="muet" style="margin:0 0 6px">' + esc([ls.auteur, ls.chapitres.length > 1 ? tx('chapitres', { n: ls.chapitres.length }) : tx('unChapitre'), tx('min', { n: minutes(mots) })].filter(Boolean).join(' · ')) + '</p>' +
    (O.offerts(ls) ? '<p class="sl-offert" style="display:inline-block;margin:0">' + esc(O.offerts(ls)) + '</p>' : '') + (faits ? barre(faits / ls.chapitres.length) : '') + '</div></div>' +
    (ls.resume ? '<div class="verre panneau"><p style="margin:0" lang="fr">' + esc(ls.resume).replace(/\n/g, '<br>') + '</p></div>' : '') +
    suite + (pass() ? '' : blocPass()) +
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
    return '<p data-para="' + (i++) + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + rendreRuns(b.r) + '</p>';
  }).join('');
}
function boutonsLiseuse() {
  return '<div class="sl-outils" role="group" aria-label="' + esc(tx('taille')) + '"><button type="button" data-sl="moins" aria-label="' + esc(tx('taille')) + ' −">A−</button><button type="button" data-sl="plus" aria-label="' + esc(tx('taille')) + ' +">A+</button>' +
    ['nuit', 'sepia', 'jour'].map(function (th) { return '<button type="button" data-sl="theme" data-val="' + th + '" aria-pressed="' + (prefs.theme === th) + '" class="sl-pastille sl-' + th + '"><span class="sr">' + esc(tx(th)) + '</span></button>'; }).join('') + '</div>';
}
function vueChapitre(id, n) {
  var ls = O.livreSalon(id);
  if (!ls) return vueLivre(id);
  var meta = ls.chapitres.filter(function (c) { return c.n === n; })[0];
  if (!meta) { setTimeout(function () { location.replace('#/lire/' + encodeURIComponent(id)); }, 0); return ''; }
  ouvrirChapitre(id, n);
  var k = id + '/' + n, c = chapitres[k];
  if (!c || c.attente) { chargerChapitre(id, n); c = chapitres[k]; }
  var tete = '<div class="sl-haut">' + retourVers('#/lire/' + encodeURIComponent(id), ls.titre) + boutonsLiseuse() + '</div>';
  var titre = (/^\s*(chap|prologue|[ée]pilogue)/i.test(meta.titre || '') ? '<p class="sl-surtitre" aria-hidden="true">✦</p>' : '<p class="sl-surtitre">' + esc(tx('chapitre', { n: n })) + '</p>') + '<h1 class="sl-titre" lang="fr">' + esc(meta.titre || tx('chapitre', { n: n })) + '</h1>';
  var corps;
  if (c.attente) corps = '<p class="muet" aria-busy="true">' + esc(tx('chargement')) + '</p>';
  else if (c.verrou || (!c.ok && !ouvert(ls, n))) corps = carteSuite(ls, n, true);
  else if (c.erreur) corps = '<p>' + esc(c.erreur) + '</p><button type="button" class="btn btn-verre" data-sl="reessayer" data-val="' + esc(k) + '">' + esc(etat.lang === 'en' ? 'Try again' : 'Réessayer') + '</button>';
  else {
    var suivant = ls.chapitres.filter(function (x) { return x.n === n + 1; })[0];
    corps = '<div class="sl-texte" lang="fr">' + rendreBlocs(c.ok.blocs) + '</div><span id="sl-fin"></span>' +
      '<p class="sl-astuce">' + esc(tx('astuce')) + '</p>' +
      '<section class="sl-reactions" aria-label="' + esc(tx('reactions')) + '"><p>' + esc(tx('reactions')) + '</p><div id="sl-emojis">' + emojis({ comptes: {}, moi: '' }) + '</div></section>' +
      (suivant ? (ouvert(ls, n + 1) ? lien('#/lire/' + encodeURIComponent(id) + '/' + (n + 1), '<span>' + esc(tx('suivant')) + '</span>' + svg('fl'), 'btn btn-primaire btn-plein') : carteSuite(ls, n + 1))
        : '<div class="sl-suite"><span class="sl-suite-ic" aria-hidden="true">🏁</span><h2 class="h3">' + esc(tx('finLivre')) + '</h2><p>' + esc(tx('finLivreD')) + '</p>' + O.aWa([tx('msgAvis', { t: ls.titre })], tx('donnerAvis'), 'btn-primaire btn-plein') + '</div>') +
      '<button type="button" class="btn btn-verre btn-plein" data-partage="lire:' + esc(id) + '/' + n + '">' + svg('partage') + esc(tx('partagerChap')) + '</button>' +
      (n > 1 ? lien('#/lire/' + encodeURIComponent(id) + '/' + (n - 1), esc(tx('precedent'))) : '');
    setTimeout(function () { apresChapitre(id, n); }, 0);
  }
  return '<div class="sl-progres" aria-hidden="true"><i id="sl-progres"></i></div><article class="liseuse sl-th-' + prefs.theme + '" style="--sl-taille:' + prefs.taille + 'px">' + tete + titre + corps + '</article>';
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

/* ---------- Après l'affichage d'un chapitre ---------- */
var observateur = null, ecouteDefilement = null;
function apresChapitre(id, n) {
  var fin = document.getElementById('sl-fin');
  if (!fin) return;
  if (observateur) observateur.disconnect();
  if ('IntersectionObserver' in window) {
    observateur = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { marquerLu(id, n); observateur.disconnect(); } });
    observateur.observe(fin);
  }
  if (!ecouteDefilement) {
    ecouteDefilement = function () {
      var b = document.getElementById('sl-progres'), t = document.querySelector('.sl-texte');
      if (!b || !t) return;
      var r = t.getBoundingClientRect(), total = r.height - window.innerHeight * .6;
      b.style.width = Math.max(0, Math.min(100, (-r.top / Math.max(1, total)) * 100)).toFixed(1) + '%';
    };
    window.addEventListener('scroll', ecouteDefilement, { passive: true });
  }
  ecouteDefilement();
  appel('action=reactions&livre=' + encodeURIComponent(id) + '&n=' + n + '&appareil=' + appareil()).then(function (d) {
    var z = document.getElementById('sl-emojis'); if (z) z.innerHTML = emojis(d);
  }, function () {});
}

/* ---------- Feuille de déblocage ---------- */
var feuilleOuverte = null;
function feuille(html, auFermer) {
  if (feuilleOuverte) feuilleOuverte.fermer(true);
  var avant = document.activeElement;
  var voile = document.createElement('div'); voile.className = 'voile';
  voile.innerHTML = '<div class="feuille verre flottant" role="dialog" aria-modal="true">' + html + '</div>';
  function fermer(sansFocus) {
    voile.remove(); document.removeEventListener('keydown', echap); feuilleOuverte = null;
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
  if (document.querySelector('.voile')) return;
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
      feuxDArtifice('📚');
      O.afficher(true);
    }, function (e) {
      bouton.disabled = false; bouton.textContent = tx('activer');
      err.hidden = false; err.textContent = e.message; champ.focus();
    });
  });
  if (code) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
  else (code === '' ? champ : v.querySelector('a,button,input')).focus();
}

/* ---------- Carte-citation : une image prête pour le statut WhatsApp ---------- */
function lignes(ctx, texte, largeur) {
  var mots = texte.split(/\s+/), res = [], l = '';
  mots.forEach(function (m) { var e = l ? l + ' ' + m : m; if (ctx.measureText(e).width > largeur && l) { res.push(l); l = m; } else l = e; });
  if (l) res.push(l);
  return res;
}
function dessinerCitation(texte, ls, n) {
  var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  var x = c.getContext('2d');
  var g = x.createLinearGradient(0, 0, W * .4, H); g.addColorStop(0, '#0A6447'); g.addColorStop(.6, '#063D2C'); g.addColorStop(1, '#03251B');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  var halo = x.createRadialGradient(W * .9, 0, 0, W * .9, 0, W * .8); halo.addColorStop(0, 'rgba(242,183,5,.32)'); halo.addColorStop(1, 'rgba(242,183,5,0)');
  x.fillStyle = halo; x.fillRect(0, 0, W, H);
  // Liseré aux couleurs APEL
  [['#1FB384', 0], ['#E2574A', 1], ['#F2B705', 2]].forEach(function (b) { x.fillStyle = b[0]; x.fillRect(90 + b[1] * 300, 0, 300, 12); });
  x.fillStyle = 'rgba(255,211,77,.9)'; x.font = 'bold 260px Georgia, "Noto Serif", serif'; x.fillText('“', 70, 330);
  var t = texte.replace(/\s+/g, ' ').trim();
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
  x.font = 'bold 30px "Inter APEL", system-ui, sans-serif'; x.fillStyle = '#FFD34D'; x.fillText(tx('citationPied'), 100, H - 120);
  x.font = '30px "Inter APEL", system-ui, sans-serif'; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText('apel-offres.pages.dev', 100, H - 72);
  return c;
}
function texteDe(p) { return (p.innerText || p.textContent || '').trim(); }
function ouvrirCitation(p) {
  var r = O.route(), id = r.args[0], n = +r.args[1], ls = O.livreSalon(id);
  if (!ls) return;
  var texte = texteDe(p), canvas = dessinerCitation(texte, ls, n);
  var url = canvas.toDataURL('image/png'), nom = 'citation-' + id + '-' + n + '.png';
  var adresse = location.origin + location.pathname + '?src=citation#/lire/' + encodeURIComponent(id) + '/' + n;
  var msg = '« ' + texte.slice(0, 600) + ' »\n— ' + ls.titre + (ls.auteur ? ', ' + ls.auteur : '') + '\n\n' + tx('citationPied') + ' : ' + adresse;
  var v = feuille('<h2 id="titre-citation">' + esc(tx('citation')) + '</h2><img class="sl-apercu" src="' + url + '" alt="' + esc(tx('citationAlt')) + '" width="1080" height="1350"><div class="pile" style="margin-top:12px">' +
    '<button type="button" class="btn btn-primaire" data-sl="partager-image">' + svg('partage') + esc(tx('citationPartager')) + '</button>' +
    '<a class="btn btn-verre" href="' + url + '" download="' + esc(nom) + '">' + esc(tx('citationTelecharger')) + '</a>' +
    '<a class="btn btn-verre" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">' + svg('wa') + esc(tx('citationWa')) + '</a>' +
    '<button type="button" class="btn btn-verre" data-fermer>' + esc(tx('fermer')) + '</button></div>');
  v.querySelector('.feuille').setAttribute('aria-labelledby', 'titre-citation');
  gagner('citation');
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
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (var i = 0; i < 14; i++) {
    var s = document.createElement('span'); s.className = 'sl-fete'; s.textContent = e; s.setAttribute('aria-hidden', 'true');
    s.style.left = (10 + Math.random() * 80) + 'vw'; s.style.animationDelay = (Math.random() * .4) + 's'; s.style.fontSize = (18 + Math.random() * 18) + 'px';
    document.body.appendChild(s);
    setTimeout(function (x) { return function () { x.remove(); }; }(s), 2200);
  }
}

/* ---------- Clics ---------- */
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-sl]');
  if (!b) {
    // Paragraphe touché dans la liseuse : carte-citation.
    var p = e.target.closest('.sl-texte p[data-para]');
    if (p && !e.target.closest('a') && !(window.getSelection && String(window.getSelection()).length > 1)) {
      var avant = document.querySelector('.sl-texte p.choisi');
      if (avant && avant !== p) avant.classList.remove('choisi');
      if (p.classList.contains('choisi')) { p.classList.remove('choisi'); return; }
      p.classList.add('choisi');
      var bt = document.getElementById('sl-citer');
      if (!bt) { bt = document.createElement('button'); bt.type = 'button'; bt.id = 'sl-citer'; bt.className = 'btn btn-primaire'; bt.setAttribute('data-sl', 'citer'); document.body.appendChild(bt); }
      bt.innerHTML = '✨ <span>' + esc(tx('citationCreer')) + '</span>';
      bt.hidden = false;
    }
    return;
  }
  var a = b.getAttribute('data-sl'), v = b.getAttribute('data-val');
  if (a === 'debloquer') feuilleDeblocage();
  else if (a === 'code') feuilleDeblocage('');
  else if (a === 'citer') { var ch = document.querySelector('.sl-texte p.choisi'); b.hidden = true; if (ch) { ch.classList.remove('choisi'); ouvrirCitation(ch); } }
  else if (a === 'plus' || a === 'moins') { prefs.taille = Math.max(15, Math.min(28, prefs.taille + (a === 'plus' ? 1 : -1))); ecrireJ('apel-liseuse', prefs); var l = document.querySelector('.liseuse'); if (l) l.style.setProperty('--sl-taille', prefs.taille + 'px'); }
  else if (a === 'theme') { prefs.theme = v; ecrireJ('apel-liseuse', prefs); var li = document.querySelector('.liseuse'); if (li) li.className = 'liseuse sl-th-' + v; [].forEach.call(document.querySelectorAll('[data-sl="theme"]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
  else if (a === 'reessayer') { delete chapitres[v]; O.afficher(true); }
  else if (a === 'reagir') {
    var r = O.route(), dejaMoi = b.getAttribute('aria-pressed') === 'true';
    appel('', { action: 'reagir', livre: r.args[0], n: +r.args[1], emoji: dejaMoi ? '' : v, appareil: appareil() }).then(function (d) {
      var z = document.getElementById('sl-emojis'); if (z) z.innerHTML = emojis(d);
      if (!dejaMoi) { gagner('avis'); var em = EMOJIS.filter(function (x) { return x[0] === v; })[0]; if (em) feuxDArtifice(em[1]); }
    }, function (er) { O.message(er.message); });
  }
});
// En quittant la liseuse, le bouton « carte-citation » disparaît.
// En changeant de page, la feuille ouverte se ferme.
window.addEventListener('hashchange', function () { var bt = document.getElementById('sl-citer'); if (bt) bt.hidden = true; if (feuilleOuverte) feuilleOuverte.fermer(true); });

/* ---------- Styles du Salon ---------- */
var css = document.createElement('style');
css.textContent = [
  '.sl-actions{display:grid;grid-template-columns:1.4fr 1fr;gap:8px;margin:4px 0 14px}',
  '.sl-actions .btn{min-height:50px;padding:10px 12px;font-size:15px}',
  '.sl-pass{display:flex;gap:12px;align-items:center;padding:14px 16px;margin:4px 0 14px}',
  '.sl-pass b{display:block}.sl-pass span span{display:block;font-size:14px;color:var(--texte-2)}',
  '.sl-pass-ic{width:40px;height:40px;flex:none;border-radius:50%;display:grid;place-items:center;font-weight:800;color:#fff;background:radial-gradient(circle at 32% 24%,rgba(255,255,255,.8) 0 6%,rgba(255,255,255,0) 32%),radial-gradient(circle at 45% 40%,#2BC795,#0A5E43 80%)}',
  '.sl-reprise{display:flex;align-items:center;gap:14px;padding:12px 14px;margin:0 0 14px;text-decoration:none;color:var(--texte)}',
  '.sl-couv{display:block;flex:none}',
  '.sl-reprise .sl-couv{width:46px}.sl-reprise small{display:block;color:var(--jaune-clair);font-weight:800;font-size:12px;letter-spacing:.06em;text-transform:uppercase}',
  '.sl-reprise b{display:block}.sl-reprise span span{display:block;font-size:14px;color:var(--texte-2)}.sl-reprise .fl{margin-left:auto}',
  '.sl-liste{display:grid;gap:12px}',
  '.sl-livre{display:flex;gap:14px;padding:14px;text-decoration:none;color:var(--texte);align-items:flex-start}',
  '.sl-livre .sl-couv{width:84px}',
  '.sl-infos{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}.sl-infos .badge{align-self:flex-start;margin:0 0 2px}',
  '.sl-infos b{font-size:17px;line-height:1.25}.sl-infos>span{color:var(--texte-2);font-size:14px}.sl-infos small{color:var(--texte-2);font-size:13px}',
  '.sl-barre{display:block;height:6px;border-radius:9px;margin-top:8px;background:rgba(0,0,0,.3);overflow:hidden}.sl-barre i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,var(--vert-vif),var(--jaune))}',
  '.sl-carnet{margin-top:22px}.sl-carnet h2{margin-bottom:12px}',
  '.sl-flamme{display:flex;gap:12px;align-items:center;padding:12px;border-radius:18px;background:rgba(0,0,0,.18);margin-bottom:12px}',
  '.sl-flamme b{display:block}.sl-flamme span span{display:block;font-size:14px;color:var(--texte-2)}',
  '.sl-feu{font-size:34px;line-height:1;filter:grayscale(.6)}.allumee .sl-feu{filter:none;animation:sl-danse 1.6s ease-in-out infinite alternate}',
  '@keyframes sl-danse{from{transform:scale(1) rotate(-4deg)}to{transform:scale(1.12) rotate(4deg)}}',
  '.sl-badges{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}',
  '.sl-badges li{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:10px 6px;border-radius:16px;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);opacity:.55}',
  '.sl-badges li>span:first-child{font-size:28px;filter:grayscale(1)}.sl-badges b{font-size:12.5px;line-height:1.2}.sl-badges small{font-size:11px;color:var(--texte-2);line-height:1.25}',
  '.sl-badges li.gagne{opacity:1;background:linear-gradient(135deg,rgba(242,183,5,.22),rgba(242,183,5,.05));box-shadow:inset 0 0 0 1px rgba(242,183,5,.55)}.sl-badges li.gagne>span:first-child{filter:none}',
  '.sl-entete{display:flex;gap:16px;align-items:flex-start}.sl-entete-couv{width:110px;flex:none}',
  '.sl-offert{font-size:13px;font-weight:800;color:var(--vert-vif);background:rgba(31,179,132,.14);border-radius:999px;padding:3px 10px;white-space:nowrap}',
  '.sl-lu{font-size:13px;font-weight:700;color:var(--texte-2);white-space:nowrap}',
  '.sl-sommaire a{gap:12px}.sl-sommaire a.ferme b{color:var(--texte-2)}.sl-sommaire .badge{margin:0;white-space:nowrap}',
  '.sl-num{width:32px;height:32px;flex:none;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;color:var(--encre);background:linear-gradient(180deg,var(--jaune-clair),var(--jaune))}',
  '.ferme .sl-num{background:rgba(255,255,255,.12);color:var(--texte-2)}',
  '.sl-progres{position:fixed;top:0;left:0;right:0;height:4px;z-index:35;background:rgba(0,0,0,.25)}.sl-progres i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--vert-vif),var(--jaune))}',
  '.liseuse{--sl-fond:transparent;--sl-encre:var(--texte);--sl-doux:var(--texte-2);margin:0 -16px;padding:4px 20px 30px;border-radius:24px;background:var(--sl-fond);color:var(--sl-encre);transition:background .3s ease,color .3s ease}',
  '.sl-th-sepia{--sl-fond:#F4ECD8;--sl-encre:#3B2F20;--sl-doux:#6B5A43}.sl-th-jour{--sl-fond:#FFFFFF;--sl-encre:#1F2A37;--sl-doux:#4B5563}',
  '.sl-th-sepia .retour,.sl-th-jour .retour{background:rgba(0,0,0,.06);box-shadow:none;color:var(--sl-encre)}.sl-th-sepia .retour::after,.sl-th-jour .retour::after{display:none}',
  '.sl-haut{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:12px;flex-wrap:wrap}.sl-haut .retour{margin:0;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
  '.sl-outils{display:flex;gap:6px;align-items:center}.sl-outils button{min-width:40px;min-height:40px;border:0;border-radius:999px;background:rgba(127,127,127,.18);color:var(--sl-encre);font-weight:800;cursor:pointer}',
  '.sl-pastille{width:40px;padding:0;box-shadow:inset 0 0 0 2px rgba(127,127,127,.4)}.sl-pastille[aria-pressed="true"]{box-shadow:inset 0 0 0 3px var(--jaune)}',
  '.sl-outils .sl-nuit{background:#063D2C}.sl-outils .sl-sepia{background:#F4ECD8}.sl-outils .sl-jour{background:#fff}',
  '.sl-surtitre{margin:26px 0 4px;text-align:center;font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--jaune-fonce)}',
  '.sl-th-nuit .sl-surtitre{color:var(--jaune-clair)}',
  '.sl-titre{text-align:center;font-family:Georgia,"Noto Serif",serif;font-weight:700;font-size:28px;margin:0 0 26px}',
  '.sl-texte{font-family:Georgia,"Noto Serif","Times New Roman",serif;font-size:var(--sl-taille,19px);line-height:1.7;hyphens:auto;-webkit-hyphens:auto}',
  '.sl-texte p{margin:0 0 .9em;text-indent:1.4em;border-radius:8px;transition:background .2s ease;cursor:pointer}',
  '.sl-texte p.sl-c{text-align:center;text-indent:0}.sl-texte p.sl-q{margin-left:1.2em;margin-right:.6em;text-indent:0;font-style:italic;color:var(--sl-doux)}',
  '.sl-texte h3{font-size:1.1em;margin:1.4em 0 .6em;text-align:center}.sl-sep{text-align:center;letter-spacing:.4em;color:var(--sl-doux);margin:1.2em 0;text-indent:0!important}',
  '.sl-texte p.choisi{background:rgba(242,183,5,.25);box-shadow:0 0 0 6px rgba(242,183,5,.25)}',
  '#sl-citer{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:36;box-shadow:0 14px 30px -10px rgba(0,0,0,.7)}',
  '.sl-astuce{font-size:13px;color:var(--sl-doux);text-align:center;margin:18px 0}',
  '.sl-reactions{text-align:center;margin:10px 0 18px}.sl-reactions p{font-weight:700;margin:0 0 10px}',
  '#sl-emojis{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}',
  '#sl-emojis button{display:flex;flex-direction:column;align-items:center;min-width:56px;min-height:56px;padding:6px 8px;border:0;border-radius:18px;cursor:pointer;background:rgba(127,127,127,.15);color:var(--sl-encre);transition:transform .15s ease}',
  '#sl-emojis button span{font-size:24px;line-height:1.2}#sl-emojis button small{font-size:12px;font-weight:700;min-height:14px}',
  '#sl-emojis button[aria-pressed="true"]{background:rgba(242,183,5,.3);box-shadow:inset 0 0 0 2px var(--jaune);transform:scale(1.06)}',
  '.liseuse .btn{margin-top:10px}',
  '.sl-th-sepia .btn-verre,.sl-th-jour .btn-verre{background:rgba(0,0,0,.07);color:var(--sl-encre);box-shadow:none}.sl-th-sepia .btn-verre::after,.sl-th-jour .btn-verre::after{display:none}',
  '.sl-suite{margin:18px 0 6px;padding:20px 16px;border-radius:22px;text-align:center;background:linear-gradient(135deg,rgba(242,183,5,.18),rgba(242,183,5,.04));box-shadow:inset 0 0 0 1px rgba(242,183,5,.45)}',
  '.sl-suite-ic{font-size:36px;display:block;margin-bottom:6px}.sl-suite h2{margin-bottom:8px}.sl-suite p{color:var(--sl-doux,var(--texte-2))}.sl-suite .sl-actions{margin-bottom:0}',
  '.sl-formules{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0}',
  '.sl-formule{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 6px;text-align:center;text-decoration:none;color:var(--texte)}',
  '.sl-formule b{font-size:15px}.sl-formule>span{font-size:13px;color:var(--jaune-clair);font-weight:700}.sl-formule em{font-style:normal;display:flex;gap:4px;align-items:center;font-size:12.5px;font-weight:800;margin-top:4px;color:var(--texte-2)}.sl-formule em svg{width:15px;height:15px}',
  '.sl-code label{display:block;font-weight:700;margin:6px 0 6px}',
  '.sl-code input{width:100%;min-height:52px;border-radius:16px;border:0;padding:12px 16px;font:inherit;font-size:20px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;text-align:center;color:var(--encre);background:#fff;margin-bottom:10px}',
  '.sl-erreur{color:#FFD0CA;background:rgba(192,57,43,.3);border-radius:12px;padding:8px 12px;font-size:14px}',
  '.feuille{max-height:calc(100vh - 24px);overflow-y:auto}',
  '.sl-apercu{width:100%;max-width:300px;margin:0 auto;border-radius:14px;box-shadow:0 14px 30px -12px rgba(0,0,0,.8)}',
  '.sl-fete{position:fixed;bottom:-40px;z-index:60;pointer-events:none;animation:sl-envol 2s ease-out forwards}',
  '@keyframes sl-envol{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(-85vh) rotate(40deg);opacity:0}}',
  '@media (max-width:360px){.sl-formules{grid-template-columns:1fr}.sl-actions{grid-template-columns:1fr}.sl-entete-couv{width:84px}}',
  '@media (prefers-reduced-motion:reduce){.allumee .sl-feu{animation:none}}'
].join('\n');
document.head.appendChild(css);

/* ---------- Point d'entrée appelé par index.html (#/lire, #/lire/<livre>, #/lire/<livre>/<n>) ---------- */
window.APEL_LECTURE = {
  vue: function (args) {
    if (!args[0]) return vueSalon();
    if (!etat.salon) return '<p class="muet" aria-busy="true" style="margin:24px 4px">' + esc(tx('chargement')) + '</p>';
    var n = parseInt(args[1], 10);
    return n >= 1 ? vueChapitre(args[0], n) : vueLivre(args[0]);
  }
};
})();
