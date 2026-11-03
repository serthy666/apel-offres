/* Espace gérant d'APEL Éditions (gerant.html) : codes de lecture, livres du Salon, tarifs, gérants.
   Tout passe par /api/gerant (functions/api/gerant.js). */
(function () {
'use strict';
var API = 'api/gerant';
var SITE = location.origin + location.pathname.replace(/[^\/]*$/, '');
var FORMULES = { jour: '24 heures', semaine: '1 semaine', mois: '1 mois' };
var GENRES = { roman: 'Roman', nouvelles: 'Nouvelles', poesie: 'Poésie', conte: 'Contes', theatre: 'Théâtre', essai: 'Essai', temoignage: 'Témoignage', jeunesse: 'Jeunesse', feuilleton: 'Feuilleton', autre: 'Autre' };
var configSite = {};
var gerant = null, donnees = null, onglet = 'codes', filtre = 'tous', recherche = '', typeCode = 'semaine', derniersCodes = [], editeur = null;

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function date(s, heure) { if (!s) return ''; try { return new Date(s * 1000).toLocaleString('fr-FR', heure ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
function mille(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
var minuteToast;
function toast(t) { var e = $('toast'); e.textContent = t; e.hidden = false; clearTimeout(minuteToast); minuteToast = setTimeout(function () { e.hidden = true; }, 3000); }
function copier(t) {
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast('Copié'); }, function () { window.prompt('Copiez :', t); });
  else window.prompt('Copiez :', t);
}

/* ---------- Appels au serveur ---------- */
function appel(methode, corps, params) {
  var h = { 'content-type': 'application/json' };
  if (gerant) h.authorization = 'Bearer ' + gerant.jeton;
  return fetch(API + (params ? '?' + params : ''), { method: methode, headers: h, body: corps ? JSON.stringify(corps) : undefined, cache: 'no-store' })
    .then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 || (r.status === 403 && gerant && corps && ['inviter', 'retirer', 'role'].indexOf(corps.action) < 0)) { deconnecter(); }
        if (!r.ok) { var e = new Error(d.erreur || 'Erreur ' + r.status); e.statut = r.status; throw e; }
        return d;
      });
    }, function () { throw new Error('Pas de connexion internet. Vérifiez le réseau puis réessayez.'); });
}
function occupe(bouton, texte) {
  var avant = bouton.innerHTML; bouton.disabled = true; bouton.textContent = texte || 'Patientez…';
  return function () { bouton.disabled = false; bouton.innerHTML = avant; };
}

/* ---------- Connexion Google ---------- */
function montrer(vue) { $('vue-connexion').hidden = vue !== 'connexion'; $('vue-admin').hidden = vue !== 'admin'; }
function preparerGoogle() {
  appel('GET', null, 'action=config').then(function (c) {
    configSite = c;
    var att = $('google-attente');
    if (!c.pret) { att.innerHTML = 'L’espace gérant n’est pas encore configuré sur Cloudflare (base D1 « DB », <code>GOOGLE_CLIENT_ID</code>, <code>SESSION_SECRET</code>). Voir le fichier <code>SALON-LECTURE.md</code> du dépôt.'; return; }
    var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = function () {
      google.accounts.id.initialize({ client_id: c.clientId, callback: function (rep) { connexion(rep.credential); }, ux_mode: 'popup', auto_select: false });
      att.hidden = true;
      google.accounts.id.renderButton($('btn-google'), { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', locale: 'fr', width: 280 });
    };
    s.onerror = function () { att.textContent = 'Impossible de joindre Google. Vérifiez la connexion internet, puis rechargez la page.'; };
    document.head.appendChild(s);
  }).catch(function (e) { $('google-attente').textContent = e.message; });
}
function connexion(credential) {
  var rf = $('refus'); rf.hidden = true;
  appel('POST', { action: 'connexion', credential: credential }).then(function (g) {
    gerant = g; try { sessionStorage.setItem('apel-gerant', JSON.stringify(g)); } catch (e) {}
    charger();
  }).catch(function (e) { rf.hidden = false; rf.textContent = e.message; });
}
function deconnecter() {
  gerant = null; donnees = null; try { sessionStorage.removeItem('apel-gerant'); } catch (e) {}
  if (window.google && google.accounts) google.accounts.id.disableAutoSelect();
  montrer('connexion'); $('qui').textContent = 'APEL Éditions · Salon de lecture';
  if (!$('btn-google').firstChild) preparerGoogle();
}

/* ---------- Tableau de bord ---------- */
function charger() {
  montrer('admin');
  return appel('GET', null, 'action=tableau').then(function (d) {
    donnees = d;
    $('qui').textContent = d.moi + ' · ' + (NOMS_ROLE[d.role] || 'Gérant').toLowerCase();
    rendre();
  }).catch(function (e) { if (gerant) { $('panneau').innerHTML = '<p class="message ko">' + esc(e.message) + '</p>'; } });
}
function rendre() {
  [].forEach.call(document.querySelectorAll('[data-onglet]'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-onglet') === onglet)); });
  var p = $('panneau');
  p.innerHTML = { codes: vueCodes, livres: vueLivres, videos: vueVideos, reglages: vueReglages, gerants: vueGerants }[onglet]();
  p.classList.remove('entree'); void p.offsetWidth; p.classList.add('entree');
  if (onglet === 'livres' && editeur) brancherEditeur();
  if (onglet === 'videos') brancherVideos();
}

/* ---------- Codes ---------- */
function etatTexte(c) {
  if (c.etat === 'revoque') return ['revoque', 'Révoqué'];
  if (c.type === 'promo') {
    var u = c.utilises + (c.max ? ' / ' + c.max : '') + ' utilisation' + (c.utilises > 1 ? 's' : '');
    return [c.etat, (c.etat === 'actif' ? 'Promo active' : 'Promo terminée') + ' · ' + u + (c.jusqua ? ' · jusqu’au ' + date(c.jusqua) : '')];
  }
  if (c.etat === 'neuf') return ['neuf', 'Pas encore utilisé'];
  if (c.etat === 'actif') return ['actif', 'Actif jusqu’au ' + date(c.fin, true)];
  return ['fini', 'Expiré le ' + date(c.fin, true)];
}
function numeroDans(note) {
  // Numéro écrit avec ou sans espaces, points ou tirets : « 677 12 34 56 », « +237 6.77.12.34.56 »…
  var m = String(note || '').match(/\+?\d[\d\s.()-]{7,}\d/), d = m ? m[0].replace(/\D/g, '').replace(/^00/, '') : '';
  if (/^6\d{8}$|^2\d{8}$/.test(d)) d = '237' + d;
  return /^\d{11,15}$/.test(d) ? d : '';
}
function lienCode(c) { return SITE + '?code=' + encodeURIComponent(c.affiche) + '#/lire'; }
function messageCode(c) {
  var nom = String(c.note || '').replace(/[\d+()\s.-]{8,}/g, ' ').trim();
  if (c.type === 'promo') return 'Bonjour' + (nom ? ' ' + nom : '') + ' ! Voici un code promo du Salon de lecture d’APEL Éditions : ' + c.affiche + '\n' +
    c.jours + ' jour' + (c.jours > 1 ? 's' : '') + ' de lecture offerts, à partir de son utilisation.\nTouchez ce lien pour en profiter : ' + lienCode(c) + '\nBonne lecture !';
  return 'Bonjour' + (nom ? ' ' + nom : '') + ', voici votre code de lecture APEL Éditions : ' + c.affiche + '\n' +
    'Formule : ' + FORMULES[c.type] + ', à partir de la première utilisation (sur 2 appareils au plus).\n' +
    'Touchez ce lien pour l’activer : ' + lienCode(c) + '\nBonne lecture dans le Salon !';
}
function lienWaCode(c) { return 'https://wa.me/' + numeroDans(c.note) + '?text=' + encodeURIComponent(messageCode(c)); }
function boutonsCode(c) {
  return '<button type="button" class="btn btn-verre btn-petit" data-copier="' + esc(c.code) + '">Copier</button>' +
    '<a class="btn btn-primaire btn-petit" target="_blank" rel="noopener" href="' + esc(lienWaCode(c)) + '">' + (numeroDans(c.note) ? 'Envoyer sur WhatsApp' : 'WhatsApp') + '</a>';
}
function trouverCode(k) {
  var l = derniersCodes.concat((donnees && donnees.codes) || []);
  for (var i = 0; i < l.length; i++) if (l[i].code === k) return l[i];
  return null;
}
function vueCodes() {
  var d = donnees, codes = d.codes || [];
  var neufs = codes.filter(function (c) { return c.etat === 'neuf'; }).length;
  var q = recherche.toLowerCase();
  var liste = codes.filter(function (c) {
    if (filtre === 'promo' && c.type !== 'promo') return false;
    if (filtre !== 'tous' && filtre !== 'promo' && c.etat !== filtre) return false;
    return !q || (c.affiche + ' ' + (c.note || '') + ' ' + c.type).toLowerCase().indexOf(q) >= 0;
  });
  return '<div class="chiffres"><div><b>' + d.lecteursActifs + '</b><span>appareils avec un code actif</span></div><div><b>' + neufs + '</b><span>codes pas encore utilisés</span></div><div><b>' + (d.livres || []).length + '</b><span>livres dans le Salon</span></div></div>' +
    '<section class="carte"><h2>Code pour un lecteur</h2><p class="muet">Après le paiement reçu (Orange Money, MTN MoMo…), créez son code puis envoyez-le-lui sur WhatsApp. La durée commence à sa première utilisation.</p>' +
    '<div class="choix-type" role="group" aria-label="Durée">' + Object.keys(FORMULES).map(function (k) { return '<button type="button" data-type="' + k + '" aria-pressed="' + (typeCode === k) + '">' + FORMULES[k] + '<small>' + esc(((d.reglages || {})['prix_' + k]) || 'tarif à régler') + '</small></button>'; }).join('') + '</div>' +
    '<div class="ligne2"><div><label for="note">Lecteur (nom et numéro WhatsApp, facultatif)</label><input type="text" id="note" maxlength="120" placeholder="Ex. Marie 6 77 12 34 56"></div>' +
    '<div><label for="nombre">Nombre de codes</label><input type="number" id="nombre" min="1" max="50" value="1"></div></div>' +
    '<div class="actions"><button type="button" class="btn btn-primaire" id="creer">Créer le code</button></div><div id="crees">' + derniersCodes.map(function (c) {
      return '<div class="code-cree"><b>' + esc(c.affiche) + '</b><p class="muet" style="margin:4px 0 0">' + esc(c.type === 'promo' ? 'Code promo · ' + c.jours + ' jours' : FORMULES[c.type]) + (c.note ? ' · ' + esc(c.note) : '') + '</p><div class="actions">' + boutonsCode(c) + '</div></div>';
    }).join('') + '</div></section>' +
    '<section class="carte"><h2>Code promo</h2><p class="muet">Un mot facile à retenir (ex. RENTREE2026), partagé à tous : chaque lecteur qui l’utilise reçoit des jours de lecture offerts.</p>' +
    '<div class="ligne2"><div><label for="promo-mot">Mot du code</label><input type="text" id="promo-mot" maxlength="24" placeholder="RENTREE2026" style="text-transform:uppercase"></div>' +
    '<div><label for="promo-jours">Jours de lecture offerts</label><input type="number" id="promo-jours" min="1" max="365" value="3"></div></div>' +
    '<div class="ligne2"><div><label for="promo-max">Nombre de lecteurs au plus (0 = sans limite)</label><input type="number" id="promo-max" min="0" value="50"></div>' +
    '<div><label for="promo-fin">Valable jusqu’au (facultatif)</label><input type="date" id="promo-fin"></div></div>' +
    '<label for="promo-note">Note (facultatif)</label><input type="text" id="promo-note" maxlength="120" placeholder="Ex. Salon du livre de Yaoundé">' +
    '<div class="actions"><button type="button" class="btn btn-primaire" id="creer-promo">Créer le code promo</button></div></section>' +
    '<section class="carte"><h2>Tous les codes</h2><label for="cherche-code" class="sr">Chercher un code</label><input type="text" id="cherche-code" placeholder="Chercher un code ou un lecteur" value="' + esc(recherche) + '">' +
    '<div class="filtres" role="group" aria-label="Filtrer">' + [['tous', 'Tous'], ['actif', 'Actifs'], ['neuf', 'Pas encore utilisés'], ['fini', 'Terminés'], ['promo', 'Promos'], ['revoque', 'Révoqués']].map(function (f) {
      return '<button type="button" data-filtre="' + f[0] + '" aria-pressed="' + (filtre === f[0]) + '">' + f[1] + '</button>';
    }).join('') + '</div>' +
    (liste.length ? '<ul class="liste">' + liste.map(function (c) {
      var e = etatTexte(c);
      return '<li><div class="infos"><span class="code">' + esc(c.affiche) + '</span><span class="etat etat-' + e[0] + '">' + esc(c.type === 'promo' ? 'Promo ' + c.jours + ' j' : FORMULES[c.type] || c.type) + '</span>' +
        '<small>' + esc(e[1]) + (c.note ? ' · ' + esc(c.note) : '') + ' · créé le ' + esc(date(c.cree)) + '</small></div><div class="actions" style="margin:0">' +
        (c.etat !== 'revoque' && c.etat !== 'fini' ? boutonsCode(c) : '') +
        '<button type="button" class="btn btn-verre btn-petit" data-revoquer="' + esc(c.code) + '"' + (c.etat === 'revoque' ? ' data-annuler="1">Rétablir' : '>Révoquer') + '</button></div></li>';
    }).join('') + '</ul>' : '<p class="muet">Aucun code ici pour l’instant.</p>') + '</section>';
}

/* ---------- Livres du Salon ---------- */
function catalogue() { return ((window.APEL_DEFAUT && window.APEL_DEFAUT.livres) || []).filter(function (l) { return l.id && l.titre; }); }
/* Livres prêts à publier : fiche déjà remplie et textes repérés dans le Google Drive d'APEL Éditions.
   Seuls les identifiants des fichiers sont ici : les textes restent dans le Drive, privés. */
var PRETS = [
  { id: 'sort-des-hiboux-boiteux', genre: 'roman', gratuits: 1, source: 'le PDF « Le Sort des Hiboux Boiteux (complet) »',
    fichiers: [{ id: '1mHQlrv_5PLC4aHhB0mklQNmbC-fk1z8B', nom: 'Le Sort des Hiboux Boiteux (complet).pdf', pdf: true }] },
  { id: 'temps-des-comptes', genre: 'roman', gratuits: 1, source: 'les 5 documents Google « Chapitre 1 - L\'Empire » à « Chapitre 5 - L\'Interdit » (un document par chapitre)',
    fichiers: [
      { id: '1Ms-wBhPY_u-gznY95OIXee6oSraGhgGRCoqBLpD3os0', nom: 'Chapitre 1 - L\'Empire' },
      { id: '17RZxCrQaMyd7GpfCCAw-xToNcYUSOY-oxtkcVLsaOl4', nom: 'Chapitre 2 - Le Seuil' },
      { id: '1z0knUTg_Ap5eABAMR8Q0LY-qnc-JA0MkvscqTRc-K2I', nom: 'Chapitre 3 - Le Premier Lien' },
      { id: '17T4mX3GsqtwaznfvZT2DTfZbcDzSphtajQHcpPAdano', nom: 'Chapitre 4 - Le Miroir' },
      { id: '1xk5xGyNolH9pkn5Cp2m0aS_E3JeyeHeH8Ui3lWmB7GE', nom: 'Chapitre 5 - L\'Interdit' }] }
];
function lienTelechargement(f) { return f.pdf ? 'https://drive.google.com/uc?export=download&id=' + f.id : 'https://docs.google.com/document/d/' + f.id + '/export?format=docx'; }
function pretsAPublier() { return PRETS.filter(function (p) { return !(donnees.livres || []).some(function (l) { return l.id === p.id; }); }); }
function vueLivres() {
  if (editeur) return vueEditeur();
  var l = donnees.livres || [];
  return '<section class="carte"><h2>Livres à lire en ligne</h2><p class="muet">Importez le texte (Word, LibreOffice, PDF, EPUB, RTF, page web, texte ou Markdown), ou collez-le directement. Vérifiez les chapitres, puis publiez. Le texte reste privé : il n’est jamais mis dans GitHub.</p>' +
    '<div class="actions"><button type="button" class="btn btn-primaire" data-livre="">Ajouter un livre</button><a class="btn btn-verre" href="assets/modele-salon-apel.docx" download>Télécharger le modèle Word</a></div></section>' +
    (pretsAPublier().length ? '<section class="carte carte-prete"><h2>Prêts à publier</h2><p class="muet">Fiche déjà remplie (titre, auteur, résumé, couverture, 1 chapitre offert) et texte repéré dans votre Google Drive.</p><ul class="liste">' + pretsAPublier().map(function (p) {
      var c = catalogue().filter(function (x) { return x.id === p.id; })[0] || {};
      return '<li><div class="infos"><b>' + esc(c.titre || p.id) + '</b><small>' + esc((c.auteur ? c.auteur + ' · ' : '') + 'texte : ' + p.source) + '</small></div><div class="actions" style="margin:0"><button type="button" class="btn btn-primaire btn-petit" data-pret="' + esc(p.id) + '">Préparer la publication</button></div></li>';
    }).join('') + '</ul></section>' : '') +
    (l.length ? '<section class="carte"><ul class="liste">' + l.map(function (x) {
      return '<li><div class="infos"><b>' + esc(x.titre) + '</b>' + (x.visible ? '' : '<span class="etat etat-fini">Masqué</span>') + '<small>' + esc([x.auteur, GENRES[x.genre] || '', x.chapitres + ' chapitre' + (x.chapitres > 1 ? 's' : ''), mille(x.mots) + ' mots', x.gratuits + ' offert' + (x.gratuits > 1 ? 's' : ''), x.majChapitres ? 'mis à jour le ' + date(x.majChapitres) : ''].filter(Boolean).join(' · ')) + '</small></div>' +
        '<div class="actions" style="margin:0"><a class="btn btn-verre btn-petit" href="./#/lire/' + encodeURIComponent(x.id) + '" target="_blank" rel="noopener">Voir</a><button type="button" class="btn btn-primaire btn-petit" data-livre="' + esc(x.id) + '">Modifier</button></div></li>';
    }).join('') + '</ul></section>' : '');
}
function ouvrirPret(id) {
  var p = PRETS.filter(function (x) { return x.id === id; })[0], c = catalogue().filter(function (x) { return x.id === id; })[0] || {};
  if (!p) return;
  editeur = { existant: false, pret: p, livre: { id: p.id, titre: c.titre || '', auteur: c.auteur || '', resume: c.resume_fr || '', genre: p.genre, gratuits: p.gratuits, visible: true, ordre: 0 }, nbChapitres: 0, import: null, mode: 'remplacer', anciens: null };
  rendre();
}
function ouvrirEditeur(id) {
  var x = (donnees.livres || []).filter(function (l) { return l.id === id; })[0];
  editeur = x ? { existant: true, livre: { id: x.id, titre: x.titre, auteur: x.auteur || '', resume: x.resume || '', genre: x.genre || '', gratuits: x.gratuits, visible: !!x.visible, ordre: x.ordre || 0 }, nbChapitres: x.chapitres, import: null, mode: 'remplacer', anciens: null }
    : { existant: false, livre: { id: '', titre: '', auteur: '', resume: '', genre: 'roman', gratuits: 1, visible: true, ordre: 0 }, nbChapitres: 0, import: null, mode: 'remplacer', anciens: null };
  rendre();
  if (x) appel('GET', null, 'action=chapitres&livre=' + encodeURIComponent(x.id)).then(function (d) { if (editeur && editeur.livre.id === x.id) editeur.anciens = d.chapitres; }).catch(function () {});
}
function vueEditeur() {
  var e = editeur, l = e.livre, cat = catalogue();
  var choix = e.existant ? '' : '<label for="ed-cat">Livre du catalogue</label><select id="ed-cat"><option value="">— Choisir un livre de la bibliothèque —</option>' + cat.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === l.id ? ' selected' : '') + '>' + esc(c.titre + (c.auteur ? ' · ' + c.auteur : '')) + '</option>'; }).join('') + '<option value="autre">Autre livre (pas encore dans la bibliothèque)</option></select>';
  var imp = e.import;
  return '<section class="carte"><button type="button" class="btn btn-verre btn-petit" data-fermer-editeur>← Retour à la liste</button>' +
    '<h2 style="margin-top:12px">' + (e.existant ? 'Modifier « ' + esc(l.titre) + ' »' : 'Ajouter un livre au Salon') + '</h2>' + choix +
    '<div class="ligne2"><div><label for="ed-titre">Titre</label><input type="text" id="ed-titre" maxlength="160" value="' + esc(l.titre) + '"></div>' +
    '<div><label for="ed-auteur">Auteur</label><input type="text" id="ed-auteur" maxlength="120" value="' + esc(l.auteur) + '"></div></div>' +
    '<label for="ed-id">Code du livre (lettres minuscules et tirets ; le même que dans la bibliothèque pour garder la couverture)</label><input type="text" id="ed-id" maxlength="80" value="' + esc(l.id) + '"' + (e.existant ? ' readonly' : '') + ' placeholder="ex. souhaits-maudits">' +
    '<label for="ed-genre">Genre</label><select id="ed-genre"><option value="">—</option>' + Object.keys(GENRES).map(function (g) { return '<option value="' + g + '"' + (l.genre === g ? ' selected' : '') + '>' + GENRES[g] + '</option>'; }).join('') + '</select>' +
    '<label for="ed-resume">Résumé (accroche du Salon)</label><textarea id="ed-resume" maxlength="1500">' + esc(l.resume) + '</textarea>' +
    '<div class="ligne3"><div><label for="ed-gratuits">Chapitres offerts</label><input type="number" id="ed-gratuits" min="0" max="50" value="' + l.gratuits + '"></div>' +
    '<div><label for="ed-ordre">Ordre dans le Salon</label><input type="number" id="ed-ordre" min="0" max="9999" value="' + l.ordre + '"></div>' +
    '<div><label class="case" style="margin-top:34px"><input type="checkbox" id="ed-visible"' + (l.visible ? ' checked' : '') + '> Visible</label></div></div></section>' +
    '<section class="carte"><h2>Texte du livre</h2>' +
    (e.existant ? '<p class="muet">' + e.nbChapitres + ' chapitre' + (e.nbChapitres > 1 ? 's' : '') + ' en ligne. Importez un fichier pour tout remplacer, ou pour ajouter les nouveaux chapitres à la suite (feuilleton).</p>' +
      '<div class="filtres" role="group" aria-label="Mode d’import"><button type="button" data-mode="remplacer" aria-pressed="' + (e.mode === 'remplacer') + '">Remplacer tout le livre</button><button type="button" data-mode="ajouter" aria-pressed="' + (e.mode === 'ajouter') + '">Ajouter à la suite</button></div>'
      : '<p class="muet">Un chapitre = un titre de niveau 1 (« Titre 1 » dans Word ou LibreOffice, # en Markdown), sinon une ligne qui commence par « Chapitre ». Gras, italique, centrage, citations, séparateurs *** et vers des poèmes sont gardés.</p>') +
    (e.pret && !imp ? '<div class="encadre"><b>Texte : ' + esc(e.pret.source) + '.</b>' +
      (configSite.drive ? '<p>Touchez « Prendre dans Google Drive », cochez ' + (e.pret.fichiers.length > 1 ? 'les ' + e.pret.fichiers.length + ' fichiers' : 'le fichier') + ', puis « Sélectionner ».</p><div class="actions"><button type="button" class="btn btn-primaire" id="ed-drive-pret">' + LOGO_DRIVE + 'Prendre dans Google Drive</button></div>'
        : '<p>1. Téléchargez ' + (e.pret.fichiers.length > 1 ? 'ces fichiers' : 'ce fichier') + ' (connecté au compte apeledition@gmail.com) :</p><ul class="liens-drive">' + e.pret.fichiers.map(function (f) { return '<li><a href="' + esc(lienTelechargement(f)) + '" target="_blank" rel="noopener">' + esc(f.nom) + (f.pdf ? '' : ' (en Word)') + '</a></li>'; }).join('') + '</ul><p>2. Puis « Choisir un ou plusieurs fichiers » et sélectionnez ' + (e.pret.fichiers.length > 1 ? 'les ' + e.pret.fichiers.length + ' fichiers téléchargés ensemble' : 'le fichier téléchargé') + '.</p>') + '</div>' : '') +
    '<div class="actions" style="margin-top:4px"><label for="ed-fichier" class="btn btn-verre">Choisir un ou plusieurs fichiers</label>' +
    (configSite.drive ? '<button type="button" class="btn btn-verre" id="ed-drive">' + LOGO_DRIVE + 'Google Drive</button>' : '') +
    '<button type="button" class="btn btn-verre" id="ed-coller-ouvrir" aria-expanded="' + !!e.coller + '">Coller le texte</button></div>' +
    '<input type="file" id="ed-fichier" accept="' + window.APEL_TEXTES.formats + '" multiple class="sr">' +
    '<p class="muet" style="margin-top:8px">Formats : Word (.docx), LibreOffice (.odt), PDF, EPUB, RTF, page web (.html), texte (.txt), Markdown (.md). <b>Un fichier</b> : il est découpé en chapitres. <b>Plusieurs fichiers</b> (un par chapitre, comme « Chapitre 1 - L’Empire », « Chapitre 2 - Le Seuil »…) : chaque fichier devient un chapitre, rangé selon son numéro.</p>' +
    (e.coller ? '<label for="ed-colle">Texte du livre (une ligne « Chapitre … » ou « # … » avant chaque chapitre)</label><textarea id="ed-colle" style="min-height:200px" placeholder="Chapitre 1 : Le départ&#10;&#10;Il était une fois…"></textarea><div class="actions"><button type="button" class="btn btn-primaire btn-petit" id="ed-coller">Découper en chapitres</button></div>' : '') +
    '<p class="message ko" id="ed-erreur" role="alert" hidden></p>' +
    (imp && imp.chapitres.some(function (c) { return c.garder && c.mots > 4000; }) ? '<div class="encadre"><b>Chapitres très longs pour une lecture sur téléphone.</b><p>Un PDF sans titres de chapitres arrive parfois en un seul bloc. Le site peut le couper en parties d’environ 10 minutes de lecture, aux fins de paragraphe ou de scène.</p><div class="actions"><button type="button" class="btn btn-primaire btn-petit" id="ed-decouper">Couper en parties de lecture</button></div></div>' : '') +
    (imp ? '<div style="margin-top:12px"><h3>' + imp.chapitres.length + ' chapitre' + (imp.chapitres.length > 1 ? 's' : '') + ' trouvé' + (imp.chapitres.length > 1 ? 's' : '') + ' dans « ' + esc(imp.fichier) + ' »</h3><p class="muet">Décochez ce qu’il ne faut pas publier (page de titre, remerciements…) et corrigez les titres si besoin.</p><div>' +
      imp.chapitres.map(function (c, i) {
        var debut = (c.blocs.filter(function (b) { return b.r; })[0] || { r: [['']] }).r.map(function (x) { return x[0]; }).join('').slice(0, 110);
        return '<div class="chap"><div class="chap-tete"><input type="checkbox" data-garder="' + i + '"' + (c.garder ? ' checked' : '') + ' aria-label="Publier ce chapitre"><label class="sr" for="chap-' + i + '">Titre du chapitre ' + (i + 1) + '</label><input type="text" id="chap-' + i + '" data-titre="' + i + '" value="' + esc(c.titre) + '" maxlength="160"></div>' +
          '<small>' + mille(c.mots) + ' mots · ' + esc(debut) + (debut.length >= 110 ? '…' : '') + ' · <button type="button" class="btn-lien" data-apercu="' + i + '" style="background:none;border:0;color:var(--jaune-clair);text-decoration:underline;cursor:pointer;padding:0">' + (c.ouvert ? 'Masquer' : 'Aperçu') + '</button></small>' +
          (c.ouvert ? '<div class="apercu">' + apercu(c.blocs) + '</div>' : '') + '</div>';
      }).join('') + '</div></div>' : '') + '</section>' +
    '<div class="actions"><button type="button" class="btn btn-primaire" id="ed-publier">' + (imp ? 'Publier dans le Salon' : 'Enregistrer') + '</button>' +
    (e.existant ? '<button type="button" class="btn btn-danger" id="ed-supprimer">Retirer du Salon</button>' : '') + '</div><p class="message" id="ed-message" hidden></p>';
}
function apercu(blocs) {
  return blocs.slice(0, 60).map(function (b) {
    if (b.s === 'sep') return '<p class="c">✦ ✦ ✦</p>';
    var h = b.r.map(function (x) { var t = esc(x[0]).replace(/\n/g, '<br>'); if (x[1] & 2) t = '<em>' + t + '</em>'; if (x[1] & 1) t = '<strong>' + t + '</strong>'; return t; }).join('');
    return b.s === 'h' ? '<p class="c"><strong>' + h + '</strong></p>' : '<p class="' + (b.s === 'c' ? 'c' : b.s === 'q' ? 'q' : '') + '">' + h + '</p>';
  }).join('') + (blocs.length > 60 ? '<p class="c">…</p>' : '');
}
function lireChamps() {
  var l = editeur.livre;
  ['titre', 'auteur', 'resume'].forEach(function (k) { var c = $('ed-' + k); if (c) l[k] = c.value; });
  if (!editeur.existant && $('ed-id')) l.id = $('ed-id').value.trim().toLowerCase();
  l.gratuits = parseInt($('ed-gratuits').value, 10) || 0;
  l.ordre = parseInt($('ed-ordre').value, 10) || 0;
  if ($('ed-genre')) l.genre = $('ed-genre').value;
  l.visible = $('ed-visible').checked;
}
function codeDepuis(titre) { return String(titre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); }
function brancherEditeur() {
  var cat = $('ed-cat');
  if (cat) cat.addEventListener('change', function () {
    lireChamps();
    var c = catalogue().filter(function (x) { return x.id === cat.value; })[0];
    if (c) { editeur.livre.id = c.id; editeur.livre.titre = c.titre; editeur.livre.auteur = c.auteur || ''; editeur.livre.resume = c.resume_fr || editeur.livre.resume; }
    else if (cat.value === 'autre') { editeur.livre.id = ''; }
    rendre();
  });
  var titre = $('ed-titre');
  if (titre && !editeur.existant) titre.addEventListener('input', function () { var id = $('ed-id'); if (id && (!id.value || id.dataset.auto)) { id.value = codeDepuis(titre.value); id.dataset.auto = '1'; } });
  function importer(promesse, nom) {
    var err = $('ed-erreur'), lab = document.querySelector('label[for="ed-fichier"]');
    lireChamps(); err.hidden = true;
    if (lab) lab.textContent = 'Lecture du texte…';
    promesse.then(function (r) {
      // Le texte avant le premier chapitre (page de titre, dédicace…) n'est gardé que s'il est long.
      r.chapitres.forEach(function (c) { c.garder = !c.avant || c.mots >= 150 || r.chapitres.length === 1; });
      editeur.import = { fichier: nom, chapitres: r.chapitres };
      editeur.coller = false;
      if (!editeur.livre.titre && r.titre) editeur.livre.titre = r.titre;
      if (!editeur.livre.id && editeur.livre.titre && !editeur.existant) editeur.livre.id = codeDepuis(editeur.livre.titre);
      rendre();
    }).catch(function (e) { if (lab) lab.textContent = 'Choisir un fichier'; err.hidden = false; err.textContent = e.message; });
  }
  $('ed-fichier').addEventListener('change', function (ev) {
    var l = ev.target.files || [];
    if (l.length > 1) importer(window.APEL_TEXTES.lireChapitres(l), l.length + ' fichiers');
    else if (l[0]) importer(window.APEL_TEXTES.lire(l[0]), l[0].name);
  });
  var dc = $('ed-decouper');
  if (dc) dc.addEventListener('click', function () {
    lireChamps();
    var l = [];
    editeur.import.chapitres.forEach(function (c) { if (c.garder && c.mots > 4000) window.APEL_TEXTES.decouperLong(c, 2500).forEach(function (x) { x.garder = true; l.push(x); }); else l.push(c); });
    editeur.import.chapitres = l; rendre(); toast(l.length + ' parties de lecture');
  });
  var bp = $('ed-drive-pret');
  if (bp) bp.addEventListener('click', function () {
    var fin = occupe(bp, 'Google Drive…'), ids = editeur.pret.fichiers.map(function (f) { return f.id; });
    choisirDansDrive(ids).then(function (l) {
      fin();
      if (!l.length) return;
      importer(l.length > 1 ? window.APEL_TEXTES.lireChapitres(l) : window.APEL_TEXTES.lire(l[0]), l.length > 1 ? l.length + ' fichiers de Google Drive' : l[0].name);
    }).catch(function (e) { fin(); var err = $('ed-erreur'); err.hidden = false; err.textContent = e.message; });
  });
  var bd = $('ed-drive');
  if (bd) bd.addEventListener('click', function () {
    var fin = occupe(bd, 'Google Drive…');
    choisirDansDrive().then(function (l) {
      fin();
      if (!l.length) return;
      importer(l.length > 1 ? window.APEL_TEXTES.lireChapitres(l) : window.APEL_TEXTES.lire(l[0]), l.length > 1 ? l.length + ' fichiers de Google Drive' : l[0].name);
    }).catch(function (e) { fin(); var err = $('ed-erreur'); err.hidden = false; err.textContent = e.message; });
  });
  $('ed-coller-ouvrir').addEventListener('click', function () { lireChamps(); editeur.coller = !editeur.coller; rendre(); var z = $('ed-colle'); if (z) z.focus(); });
  var bc = $('ed-coller');
  if (bc) bc.addEventListener('click', function () {
    var t = $('ed-colle').value;
    if (!t.trim()) { $('ed-colle').focus(); return; }
    importer(Promise.resolve().then(function () { return window.APEL_TEXTES.lireColle(t, editeur.livre.titre || 'Texte collé'); }), 'le texte collé');
  });
  $('ed-publier').addEventListener('click', publier);
  var sup = $('ed-supprimer');
  if (sup) sup.addEventListener('click', function () {
    if (!sup.dataset.confirmer) { sup.dataset.confirmer = '1'; sup.textContent = 'Confirmer : retirer le livre et ses chapitres'; return; }
    var fin = occupe(sup);
    appel('POST', { action: 'supprimer', id: editeur.livre.id }).then(function () { editeur = null; toast('Livre retiré du Salon'); return charger(); }).catch(function (e) { fin(); afficherMessage(e.message, false); });
  });
}
/* Google Drive : choisir un ou plusieurs textes (Google Docs, Word, PDF…) directement dans le Drive.
   Accès limité aux fichiers choisis (droit « drive.file »). */
var LOGO_DRIVE = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#1FB384" d="M8 3h8l6 10.5h-8z"/><path fill="#F2B705" d="M2 13.5L8 3l4 7-6 10.5z"/><path fill="#E2574A" d="M6 20.5l4-7h12l-4 7z"/></svg>';
var TYPES_DRIVE = { 'application/vnd.google-apps.document': '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx', 'application/pdf': '.pdf', 'application/epub+zip': '.epub', 'application/vnd.oasis.opendocument.text': '.odt', 'text/plain': '.txt', 'text/markdown': '.md', 'application/rtf': '.rtf', 'text/rtf': '.rtf', 'text/html': '.html' };
function script(src) {
  return new Promise(function (ok, ko) {
    if (document.querySelector('script[src="' + src + '"]')) { ok(); return; }
    var s = document.createElement('script'); s.src = src; s.async = true; s.onload = ok; s.onerror = function () { ko(new Error('Impossible de joindre Google Drive. Vérifiez la connexion internet.')); };
    document.head.appendChild(s);
  });
}
var jetonDrive = null;
function autoriserDrive() {
  if (jetonDrive && jetonDrive.fin > Date.now()) return Promise.resolve(jetonDrive.t);
  return new Promise(function (ok, ko) {
    if (!window.google || !google.accounts || !google.accounts.oauth2) { ko(new Error('Connexion Google indisponible : rechargez la page.')); return; }
    var client = google.accounts.oauth2.initTokenClient({
      client_id: configSite.clientId, scope: 'https://www.googleapis.com/auth/drive.file', login_hint: gerant && gerant.email,
      callback: function (r) { if (!r || r.error || !r.access_token) { ko(new Error('Accès à Google Drive refusé.')); return; } jetonDrive = { t: r.access_token, fin: Date.now() + ((r.expires_in || 3000) - 60) * 1000 }; ok(r.access_token); },
      error_callback: function () { ko(new Error('Accès à Google Drive annulé.')); }
    });
    client.requestAccessToken({ prompt: '' });
  });
}
// ids : fichiers à montrer d'emblée dans le sélecteur (livres prêts à publier)
function choisirDansDrive(ids) {
  var jeton;
  // Session reprise après un rechargement : la bibliothèque de connexion Google n'est peut-être pas encore là.
  return Promise.all([script('https://accounts.google.com/gsi/client'), script('https://apis.google.com/js/api.js')]).then(function () {
    return new Promise(function (ok) { gapi.load('picker', ok); });
  }).then(autoriserDrive).then(function (t) {
    jeton = t;
    return new Promise(function (ok) {
      var vue = new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes(Object.keys(TYPES_DRIVE).join(',')).setIncludeFolders(!ids).setSelectFolderEnabled(false);
      if (ids && vue.setFileIds) vue.setFileIds(ids.join(','));
      new google.picker.PickerBuilder().addView(vue).enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setOAuthToken(t).setDeveloperKey(configSite.drive.cle).setAppId(configSite.drive.projet).setLocale('fr').setTitle('Textes du livre (un ou plusieurs fichiers)')
        .setCallback(function (d) {
          if (d.action === google.picker.Action.PICKED) ok(d.docs || []);
          else if (d.action === google.picker.Action.CANCEL) ok([]);
        }).build().setVisible(true);
    });
  }).then(function (docs) {
    // Téléchargement : un Google Doc est converti en Word, les autres fichiers arrivent tels quels.
    return Promise.all(docs.map(function (doc) {
      var gdoc = doc.mimeType === 'application/vnd.google-apps.document';
      var url = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(doc.id) + (gdoc ? '/export?mimeType=' + encodeURIComponent('application/vnd.openxmlformats-officedocument.wordprocessingml.document') : '?alt=media');
      return fetch(url, { headers: { authorization: 'Bearer ' + jeton } }).then(function (r) {
        if (!r.ok) throw new Error('« ' + doc.name + ' » n’a pas pu être lu dans Google Drive.');
        return r.blob();
      }).then(function (b) {
        var nom = doc.name || 'texte', ext = TYPES_DRIVE[doc.mimeType] || '';
        if (ext && !new RegExp('\\' + ext + '$', 'i').test(nom)) nom += ext;
        return new File([b], nom, { type: b.type });
      });
    }));
  });
}
function afficherMessage(t, ok) { var m = $('ed-message'); if (!m) { toast(t); return; } m.hidden = false; m.className = 'message ' + (ok ? 'ok' : 'ko'); m.textContent = t; }
function publier() {
  lireChamps();
  var e = editeur, l = e.livre, corps = { action: 'livre', livre: l };
  if (!l.titre.trim()) return afficherMessage('Donnez un titre au livre.', false);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(l.id)) return afficherMessage('Code du livre : lettres minuscules, chiffres et tirets seulement (ex. souhaits-maudits).', false);
  if (e.import) {
    var garde = e.import.chapitres.filter(function (c) { return c.garder; });
    if (!garde.length) return afficherMessage('Cochez au moins un chapitre à publier.', false);
    // Un chapitre inchangé garde sa date de publication : seuls les nouveaux sont signalés « Nouveau » aux lecteurs.
    var anciens = {};
    (e.anciens || []).forEach(function (a) { anciens[a.titre + '|' + JSON.stringify(a.blocs)] = a; });
    corps.chapitres = garde.map(function (c) { var a = anciens[c.titre + '|' + JSON.stringify(c.blocs)]; return { titre: c.titre, blocs: c.blocs, ancien: a ? a.maj : 0 }; });
    corps.mode = e.existant ? e.mode : 'remplacer';
  } else if (!e.existant) return afficherMessage('Importez le fichier Word du livre.', false);
  var fin = occupe($('ed-publier'), 'Publication…');
  appel('POST', corps).then(function (r) {
    editeur = null;
    toast(r.chapitres ? 'Publié : ' + r.chapitres + ' chapitre' + (r.chapitres > 1 ? 's' : '') + ' en ligne' : 'Enregistré');
    return charger();
  }).catch(function (er) { fin(); afficherMessage(er.message, false); });
}

/* ---------- Vidéos ---------- */
var sourceVideo = 'fichier', envoiVideo = null;
var NOMS_SOURCE = { youtube: 'YouTube', tiktok: 'TikTok', facebook: 'Facebook', instagram: 'Instagram', drive: 'Google Drive', fichier: 'Vidéo du téléphone' };
function livresPourVideo() {
  var vus = {}, l = [];
  (donnees.livres || []).concat(catalogue()).forEach(function (x) { if (x.id && !vus[x.id]) { vus[x.id] = 1; l.push(x); } });
  return l;
}
function vueVideos() {
  var v = donnees.videos || [], medias = donnees.medias;
  if (!medias) sourceVideo = 'lien';
  var titreLivre = {}; livresPourVideo().forEach(function (x) { titreLivre[x.id] = x.titre; });
  return '<section class="carte"><h2>Ajouter une petite vidéo</h2><p class="muet">Bande-annonce d’un livre, mot de l’auteur, coulisses d’une séance de dédicace… Les vidéos s’affichent dans le Salon de lecture, et sur la page du livre choisi.</p>' +
    '<label for="vi-titre">Titre</label><input type="text" id="vi-titre" maxlength="120" placeholder="Ex. Robyn Tyo’o présente Souhaits maudits">' +
    '<label for="vi-desc">Description (facultatif)</label><textarea id="vi-desc" maxlength="500" style="min-height:70px"></textarea>' +
    '<label for="vi-livre">Livre concerné (facultatif)</label><select id="vi-livre"><option value="">— Aucun —</option>' + livresPourVideo().map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.titre) + '</option>'; }).join('') + '</select>' +
    '<div class="filtres" role="group" aria-label="Source de la vidéo" style="margin-top:14px"><button type="button" data-source="fichier" aria-pressed="' + (sourceVideo === 'fichier') + '"' + (medias ? '' : ' disabled') + '>Depuis le téléphone</button><button type="button" data-source="lien" aria-pressed="' + (sourceVideo === 'lien') + '">Lien YouTube, TikTok…</button></div>' +
    (sourceVideo === 'fichier'
      ? '<label for="vi-fichier" class="btn btn-verre" style="display:inline-flex">Choisir la vidéo</label><input type="file" id="vi-fichier" accept="video/*" class="sr"><p class="muet" id="vi-nom" style="margin-top:8px">Vidéo courte (1 à 3 minutes, 60 Mo au plus), au format MP4. Sur iPhone : Réglages > Appareil photo > Formats > « Le plus compatible ».</p>'
      : '<label for="vi-lien">Lien de la vidéo</label><input type="text" id="vi-lien" inputmode="url" placeholder="https://www.youtube.com/shorts/…  ou  https://www.tiktok.com/@…/video/…">' +
        (medias ? '' : '<p class="muet" style="margin-top:8px">Pour envoyer des vidéos depuis le téléphone, reliez le stockage R2 « MEDIAS » au site (voir SALON-LECTURE.md).</p>')) +
    '<div class="progres-envoi" id="vi-progres" hidden><i></i></div><p class="message ko" id="vi-erreur" role="alert" hidden></p>' +
    '<div class="actions"><button type="button" class="btn btn-primaire" id="vi-publier">Publier la vidéo</button></div></section>' +
    (v.length ? '<section class="carte"><h2>Vidéos publiées</h2><ul class="liste">' + v.map(function (x) {
      var a = x.apercu || {};
      return '<li><span class="vignette-video" aria-hidden="true">' + (a.vignette ? '<img src="' + esc(a.vignette) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=\'▶\'">' : '▶') + '</span><div class="infos"><b>' + esc(x.titre) + '</b>' + (x.visible ? '' : '<span class="etat etat-fini">Masquée</span>') +
        '<small>' + esc([NOMS_SOURCE[a.type] || 'Lien', x.livre ? titreLivre[x.livre] || x.livre : '', 'ajoutée le ' + date(x.cree)].filter(Boolean).join(' · ')) + '</small></div>' +
        '<div class="actions" style="margin:0"><button type="button" class="btn btn-verre btn-petit" data-video-visible="' + esc(x.id) + '">' + (x.visible ? 'Masquer' : 'Afficher') + '</button><button type="button" class="btn btn-danger btn-petit" data-video-suppr="' + esc(x.id) + '">Supprimer</button></div></li>';
    }).join('') + '</ul></section>' : '');
}
// Image d'affiche prise dans la vidéo (vers la 1re seconde), pour l'afficher avant la lecture.
function afficheDe(fichier) {
  return new Promise(function (ok) {
    var v = document.createElement('video'), url = URL.createObjectURL(fichier), fini = false;
    function finir(b, d) { if (fini) return; fini = true; URL.revokeObjectURL(url); ok({ blob: b, duree: d || 0 }); }
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    v.addEventListener('loadedmetadata', function () { try { v.currentTime = Math.min(1, (v.duration || 2) / 3); } catch (e) { finir(null); } });
    v.addEventListener('seeked', function () {
      try {
        var w = Math.min(540, v.videoWidth || 540), h = Math.round(w * (v.videoHeight || 960) / (v.videoWidth || 540));
        var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(v, 0, 0, w, h);
        c.toBlob(function (b) { finir(b, Math.round(v.duration || 0)); }, 'image/jpeg', 0.8);
      } catch (e) { finir(null, Math.round(v.duration || 0)); }
    });
    v.addEventListener('error', function () { finir(null); });
    setTimeout(function () { finir(null); }, 8000);
  });
}
// Envoi d'un fichier avec sa progression
function envoyer(fichier, sorte, type, progression) {
  return new Promise(function (ok, ko) {
    var x = new XMLHttpRequest();
    x.open('POST', API + '?action=televerser&sorte=' + sorte);
    x.setRequestHeader('authorization', 'Bearer ' + gerant.jeton);
    x.setRequestHeader('content-type', type);
    if (progression) x.upload.onprogress = function (e) { if (e.lengthComputable) progression(e.loaded / e.total); };
    x.onload = function () { var d = {}; try { d = JSON.parse(x.responseText); } catch (e) {} if (x.status >= 200 && x.status < 300) ok(d); else ko(new Error(d.erreur || 'Envoi refusé (' + x.status + ').')); };
    x.onerror = function () { ko(new Error('Envoi interrompu : vérifiez la connexion internet puis réessayez.')); };
    x.send(fichier);
  });
}
function brancherVideos() {
  var f = $('vi-fichier');
  if (f) f.addEventListener('change', function () { var x = f.files[0]; if (x) $('vi-nom').textContent = x.name + ' · ' + (x.size / 1048576).toFixed(1) + ' Mo'; });
  $('vi-publier').addEventListener('click', function () {
    var b = this, err = $('vi-erreur'), titre = $('vi-titre').value.trim();
    err.hidden = true;
    function echec(e) { fin(); envoiVideo = null; $('vi-progres').hidden = true; err.hidden = false; err.textContent = e.message; }
    if (!titre) { err.hidden = false; err.textContent = 'Donnez un titre à la vidéo.'; $('vi-titre').focus(); return; }
    var video = { titre: titre, description: $('vi-desc').value, livre: $('vi-livre').value };
    var fin = occupe(b, 'Publication…');
    if (sourceVideo === 'lien') {
      video.lien = $('vi-lien').value.trim();
      appel('POST', { action: 'video', video: video }).then(function () { fin(); toast('Vidéo publiée'); return charger(); }).catch(echec);
      return;
    }
    var fichier = f && f.files[0];
    if (!fichier) { fin(); err.hidden = false; err.textContent = 'Choisissez la vidéo.'; return; }
    if (fichier.size > 60 * 1048576) { fin(); err.hidden = false; err.textContent = 'Vidéo trop lourde (' + Math.round(fichier.size / 1048576) + ' Mo) : 60 Mo au plus. Raccourcissez-la (1 à 3 minutes).'; return; }
    var barre = $('vi-progres'); barre.hidden = false;
    var type = fichier.type || (/\.mov$/i.test(fichier.name) ? 'video/quicktime' : 'video/mp4');
    envoiVideo = afficheDe(fichier).then(function (a) {
      video.duree = a.duree;
      return (a.blob ? envoyer(a.blob, 'affiche', 'image/jpeg').then(function (r) { video.affiche = r.cle; }, function () {}) : Promise.resolve());
    }).then(function () {
      return envoyer(fichier, 'video', type, function (x) { barre.firstChild.style.width = Math.round(x * 100) + '%'; b.textContent = 'Envoi… ' + Math.round(x * 100) + ' %'; });
    }).then(function (r) {
      video.cle = r.cle;
      return appel('POST', { action: 'video', video: video });
    }).then(function () { envoiVideo = null; fin(); toast('Vidéo publiée'); return charger(); }).catch(echec);
  });
}

/* ---------- Tarifs ---------- */
function vueReglages() {
  var r = donnees.reglages || {};
  return '<section class="carte"><h2>Tarifs des codes de lecture</h2><p class="muet">Affichés aux lecteurs quand ils demandent un code. Laissez vide pour « tarif sur WhatsApp ».</p>' +
    '<div class="ligne3"><div><label for="prix-jour">24 heures</label><input type="text" id="prix-jour" maxlength="40" placeholder="ex. 200 FCFA" value="' + esc(r.prix_jour || '') + '"></div>' +
    '<div><label for="prix-semaine">1 semaine</label><input type="text" id="prix-semaine" maxlength="40" placeholder="ex. 1 000 FCFA" value="' + esc(r.prix_semaine || '') + '"></div>' +
    '<div><label for="prix-mois">1 mois</label><input type="text" id="prix-mois" maxlength="40" placeholder="ex. 3 000 FCFA" value="' + esc(r.prix_mois || '') + '"></div></div>' +
    '<label for="accueil">Mot d’accueil du Salon (facultatif)</label><textarea id="accueil" maxlength="400" placeholder="Ex. Cette semaine : 2 nouveaux chapitres de Souhaits maudits !">' + esc(r.accueil || '') + '</textarea>' +
    '<div class="actions"><button type="button" class="btn btn-primaire" id="enregistrer-reglages">Enregistrer</button></div></section>';
}

/* ---------- Équipe : administrateurs et gérants ---------- */
var NOMS_ROLE = { proprietaire: 'Propriétaire', admin: 'Administrateur', gerant: 'Gérant' };
function estAdmin() { return donnees && (donnees.role === 'proprietaire' || donnees.role === 'admin'); }
function vueGerants() {
  var d = donnees, g = d.gerants || [], admin = estAdmin();
  var membres = [{ email: d.proprietaire, role: 'proprietaire', fixe: true }]
    .concat((d.secours || []).filter(function (e) { return e !== d.proprietaire; }).map(function (e) { return { email: e, role: 'admin', fixe: true, secours: true }; }))
    .concat(g.map(function (x) { return { email: x.email, role: x.role === 'admin' ? 'admin' : 'gerant', statut: x.statut, depuis: x.depuis }; }));
  return '<section class="carte"><h2>Équipe</h2><p class="muet"><b>Administrateurs</b> : tous les droits, y compris ajouter, retirer ou changer le rôle des membres. <b>Gérants</b> : codes de lecture, livres, vidéos et tarifs.</p>' +
    '<ul class="liste">' + membres.map(function (m) {
      var moi = m.email === d.moi;
      var info = m.role === 'proprietaire' ? 'Propriétaire du site' : m.secours ? 'Administrateur de secours (réglage Cloudflare)' : (m.statut === 'actif' ? 'Actif depuis le ' : 'Invité le ') + (m.depuis || '');
      var actions = '';
      if (admin && !m.fixe && !moi) actions = '<label class="sr" for="role-' + esc(m.email) + '">Rôle de ' + esc(m.email) + '</label><select class="choix-role" id="role-' + esc(m.email) + '" data-role-de="' + esc(m.email) + '"><option value="admin"' + (m.role === 'admin' ? ' selected' : '') + '>Administrateur</option><option value="gerant"' + (m.role === 'gerant' ? ' selected' : '') + '>Gérant</option></select>' +
        '<button type="button" class="btn btn-danger btn-petit" data-retirer="' + esc(m.email) + '">Retirer</button>';
      return '<li><div class="infos"><b>' + esc(m.email) + '</b><span class="etat ' + (m.role === 'gerant' ? 'etat-neuf' : 'etat-actif') + '">' + NOMS_ROLE[m.role] + '</span>' + (moi ? ' <span class="etat etat-fini">Vous</span>' : '') + '<small>' + esc(info) + '</small></div>' +
        (actions ? '<div class="actions" style="margin:0">' + actions + '</div>' : '') + '</li>';
    }).join('') + '</ul></section>' +
    (admin ? '<section class="carte"><h2>Ajouter un membre</h2>' +
      '<label for="invite">Adresse e-mail (compte Google)</label><input type="email" id="invite" placeholder="prenom.nom@gmail.com" autocomplete="off">' +
      '<div class="choix-type" role="group" aria-label="Rôle" style="grid-template-columns:1fr 1fr"><button type="button" data-nouveau-role="admin" aria-pressed="' + (nouveauRole === 'admin') + '">Administrateur<small>tous les droits</small></button><button type="button" data-nouveau-role="gerant" aria-pressed="' + (nouveauRole === 'gerant') + '">Gérant<small>codes, livres, vidéos</small></button></div>' +
      '<p class="muet" style="margin-top:8px">La personne se connecte ensuite sur cette page avec « Se connecter avec Google », en utilisant cette adresse. Une adresse Gmail convient, ou une adresse professionnelle déjà liée à un compte Google.</p>' +
      '<div class="actions"><button type="button" class="btn btn-primaire" id="inviter">Ajouter à l’équipe</button></div></section>'
      : '<p class="muet">Seuls les administrateurs ajoutent ou retirent des membres de l’équipe.</p>');
}
var nouveauRole = 'admin';

/* ---------- Clics ---------- */
document.addEventListener('click', function (e) {
  var b = e.target.closest('button,a');
  if (!b) return;
  var v;
  if ((v = b.getAttribute('data-onglet'))) { onglet = v; editeur = null; rendre(); return; }
  if ((v = b.getAttribute('data-type'))) { typeCode = v; [].forEach.call(document.querySelectorAll('[data-type]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); return; }
  if ((v = b.getAttribute('data-filtre'))) { filtre = v; rendre(); return; }
  if ((v = b.getAttribute('data-copier'))) { var c = trouverCode(v); if (c) copier(messageCode(c)); return; }
  if ((v = b.getAttribute('data-revoquer'))) {
    var annuler = !!b.getAttribute('data-annuler');
    if (!annuler && !b.dataset.confirmer) { b.dataset.confirmer = '1'; b.textContent = 'Confirmer'; return; }
    var f = occupe(b);
    appel('POST', { action: 'revoquer', code: v, annuler: annuler }).then(function () { toast(annuler ? 'Code rétabli' : 'Code révoqué : la lecture est coupée'); return charger(); }).catch(function (er) { f(); toast(er.message); });
    return;
  }
  if (b.hasAttribute('data-livre')) { ouvrirEditeur(b.getAttribute('data-livre')); return; }
  if ((v = b.getAttribute('data-pret'))) { ouvrirPret(v); return; }
  if (b.hasAttribute('data-fermer-editeur')) { editeur = null; rendre(); return; }
  if ((v = b.getAttribute('data-mode'))) { lireChamps(); editeur.mode = v; rendre(); return; }
  if ((v = b.getAttribute('data-apercu'))) { lireChamps(); var ch = editeur.import.chapitres[+v]; ch.ouvert = !ch.ouvert; rendre(); return; }
  if ((v = b.getAttribute('data-source'))) { sourceVideo = v; rendre(); return; }
  if ((v = b.getAttribute('data-video-visible'))) {
    var vi = (donnees.videos || []).filter(function (x) { return x.id === v; })[0];
    if (vi) appel('POST', { action: 'video', video: { id: vi.id, titre: vi.titre, description: vi.description, livre: vi.livre, lien: vi.lien, cle: vi.cle, affiche: vi.affiche, duree: vi.duree, ordre: vi.ordre, visible: !vi.visible } })
      .then(function () { toast(vi.visible ? 'Vidéo masquée' : 'Vidéo affichée'); return charger(); }).catch(function (er) { toast(er.message); });
    return;
  }
  if ((v = b.getAttribute('data-video-suppr'))) {
    if (!b.dataset.confirmer) { b.dataset.confirmer = '1'; b.textContent = 'Confirmer'; return; }
    appel('POST', { action: 'video_supprimer', id: v }).then(function () { toast('Vidéo supprimée'); return charger(); }).catch(function (er) { toast(er.message); });
    return;
  }
  if ((v = b.getAttribute('data-retirer'))) {
    if (!b.dataset.confirmer) { b.dataset.confirmer = '1'; b.textContent = 'Confirmer'; return; }
    appel('POST', { action: 'retirer', email: v }).then(function () { toast('Membre retiré de l’équipe'); return charger(); }).catch(function (er) { toast(er.message); });
    return;
  }
  if ((v = b.getAttribute('data-nouveau-role'))) { nouveauRole = v; [].forEach.call(document.querySelectorAll('[data-nouveau-role]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); return; }
  switch (b.id) {
    case 'creer': {
      var fin = occupe(b, 'Création…');
      appel('POST', { action: 'codes', type: typeCode, nombre: $('nombre').value, note: $('note').value }).then(function (r) {
        derniersCodes = r.codes; toast(r.codes.length > 1 ? r.codes.length + ' codes créés' : 'Code créé'); return charger();
      }).catch(function (er) { fin(); toast(er.message); });
      break;
    }
    case 'creer-promo': {
      var fp = occupe(b, 'Création…');
      appel('POST', { action: 'promo', mot: $('promo-mot').value, jours: $('promo-jours').value, max: $('promo-max').value, jusqua: $('promo-fin').value, note: $('promo-note').value }).then(function (r) {
        derniersCodes = [Object.assign({ note: $('promo-note').value }, r.code)]; toast('Code promo créé'); return charger();
      }).catch(function (er) { fp(); toast(er.message); });
      break;
    }
    case 'enregistrer-reglages': {
      var fr = occupe(b, 'Enregistrement…');
      appel('POST', { action: 'reglages', reglages: { prix_jour: $('prix-jour').value, prix_semaine: $('prix-semaine').value, prix_mois: $('prix-mois').value, accueil: $('accueil').value } })
        .then(function () { toast('Tarifs enregistrés'); return charger(); }).catch(function (er) { fr(); toast(er.message); });
      break;
    }
    case 'inviter':
      appel('POST', { action: 'inviter', email: $('invite').value, role: nouveauRole }).then(function (r) { toast((r.role === 'admin' ? 'Administrateur' : 'Gérant') + ' ajouté : connexion avec ' + r.email); return charger(); }).catch(function (er) { toast(er.message); });
      break;
    case 'pass': {
      var fpass = occupe(b);
      var a = localStorage.getItem('apel-appareil');
      if (!/^[a-z0-9]{16,40}$/.test(a || '')) { a = ''; for (var i = 0; i < 24; i++) a += Math.floor(Math.random() * 36).toString(36); localStorage.setItem('apel-appareil', a); }
      appel('POST', { action: 'pass', appareil: a }).then(function (r) {
        localStorage.setItem('apel-pass', JSON.stringify({ jeton: r.jeton, fin: r.fin, formule: r.formule, type: r.type }));
        fpass(); toast('Pass gérant actif 12 heures sur cet appareil');
      }).catch(function (er) { fpass(); toast(er.message); });
      break;
    }
    case 'deconnexion': deconnecter(); break;
  }
});
document.addEventListener('change', function (e) {
  var rd = e.target.getAttribute && e.target.getAttribute('data-role-de');
  if (rd) appel('POST', { action: 'role', email: rd, role: e.target.value }).then(function () { toast('Rôle changé : ' + (e.target.value === 'admin' ? 'administrateur' : 'gérant')); return charger(); }).catch(function (er) { toast(er.message); charger(); });
  var g = e.target.getAttribute && e.target.getAttribute('data-garder');
  if (g != null && editeur && editeur.import) editeur.import.chapitres[+g].garder = e.target.checked;
});
document.addEventListener('input', function (e) {
  var t = e.target.getAttribute && e.target.getAttribute('data-titre');
  if (t != null && editeur && editeur.import) editeur.import.chapitres[+t].titre = e.target.value;
  if (e.target.id === 'cherche-code') {
    recherche = e.target.value;
    var pos = e.target.selectionStart; rendre();
    var c = $('cherche-code'); if (c) { c.focus(); try { c.setSelectionRange(pos, pos); } catch (er) {} }
  }
});

/* ---------- Démarrage ---------- */
try { gerant = JSON.parse(sessionStorage.getItem('apel-gerant') || 'null'); } catch (e) { gerant = null; }
if (gerant && gerant.expire * 1000 > Date.now()) { charger(); appel('GET', null, 'action=config').then(function (c) { configSite = c; if (onglet === 'livres' && editeur) rendre(); }).catch(function () {}); } else { gerant = null; montrer('connexion'); preparerGoogle(); }
})();
