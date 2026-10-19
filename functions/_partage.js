// Pages relais des liens partagés (Cloudflare Pages Functions).
// Les robots de WhatsApp et Facebook ne lisent pas le JavaScript : pour /l/<code> (livre) et /o/<code> (offre),
// on renvoie une petite page dont l'aperçu (titre, description, image) est celui du livre ou de l'offre,
// puis le visiteur est aussitôt redirigé vers l'appli (/?livre=<code> ou /?pack=<code>).
// Quoi qu'il arrive (tableur injoignable, code inconnu), la page relais part avec l'aperçu général :
// le lien ne casse jamais.

// Mêmes identifiants que CONFIG.sheetId et CONFIG.livresSheetId dans index.html.
const TABLEUR_OFFRES = '1Cgaxi_SWzB9NGhl9LkeGCm_gDmgx2y4H-hVEi2Ed7o8';
const TABLEUR_LIVRES = '1Y7rfIrzuaJ44LR5YYbMu_JQLXDe1chQg5spTOxTW53s';

const ENTETES = {
  afficher: 'afficher', code: 'id', id: 'id', titre: 'titre', titrefr: 'titre_fr', titreen: 'titre_en', auteur: 'auteur',
  editeur: 'editeur', prix: 'prix', prixfcfa: 'prix', prixpapier: 'prix', prixnumerique: 'prix_num', apartirde: 'apartirde',
  envente: 'vente', vente: 'vente', couverture: 'couverture', couvertureliendrive: 'couverture',
  resumefr: 'resume_fr', resumeen: 'resume_en', accrochefr: 'accroche_fr', accrocheen: 'accroche_en',
  unitefr: 'unite_fr', uniteen: 'unite_en', offredulivre: 'offre_livre'
};

function cle(h) {
  const n = String(h).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  return ENTETES[n] || (n.indexOf('afficher') === 0 ? 'afficher' : '');
}
function lireCSV(t) {
  const lignes = []; let ligne = [], cel = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cel += '"'; i++; } else q = false; } else cel += c; }
    else if (c === '"') q = true;
    else if (c === ',') { ligne.push(cel); cel = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; ligne.push(cel); lignes.push(ligne); ligne = []; cel = ''; }
    else cel += c;
  }
  if (cel !== '' || ligne.length) { ligne.push(cel); lignes.push(ligne); }
  return lignes;
}
const faux = v => v === false || v === 0 || /^(non|no|0|false|faux)$/i.test(String(v == null ? '' : v).trim());
const vrai = v => v === true || /^(oui|yes|1|true|vrai)$/i.test(String(v == null ? '' : v).trim());
const nombre = v => { if (typeof v === 'number') return v; const m = String(v || '').replace(/\s/g, '').match(/\d[\d.,]*/); return m ? parseInt(m[0].replace(/[.,]\d{1,2}$/, '').replace(/[.,]/g, ''), 10) || 0 : 0; };
const code = v => String(v || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
const fcfa = (n, en) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, en ? ',' : ' ') + ' FCFA';
const extrait = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };
function idDrive(u) {
  u = String(u || '').trim();
  const m = u.match(/\/d\/([\w-]{20,})/) || u.match(/[?&]id=([\w-]{20,})/) || u.match(/^([\w-]{25,})$/);
  return m ? m[1] : '';
}

// Lignes visibles et masquées du premier onglet d'un tableur, ou null s'il est injoignable.
async function tableur(id, env) {
  const base = (env && env.GVIZ_BASE) || 'https://docs.google.com/spreadsheets/d/';
  const ctl = new AbortController();
  const minuteur = setTimeout(() => ctl.abort(), 2500);
  try {
    const r = await fetch(base + id + '/gviz/tq?tqx=out:csv&headers=1&gid=0', { signal: ctl.signal, cf: { cacheTtl: 300, cacheEverything: true } });
    if (!r.ok) return null;
    const t = await r.text();
    if (/^\s*</.test(t)) return null;
    const lignes = lireCSV(t);
    if (lignes.length < 1) return null;
    const cles = lignes[0].map(cle);
    return lignes.slice(1).map(l => { const o = {}; cles.forEach((k, i) => { if (k) o[k] = (l[i] || '').trim(); }); return o; })
      .filter(o => Object.keys(o).some(k => o[k]));
  } catch (e) {
    return null;
  } finally {
    clearTimeout(minuteur);
  }
}
async function integres(url, env) {
  try {
    const r = await env.ASSETS.fetch(new URL('/donnees.js', url));
    const t = await r.text();
    return JSON.parse(t.slice(t.indexOf('=') + 1).trim().replace(/;\s*$/, ''));
  } catch (e) {
    return { packs: [], livres: [] };
  }
}

// Livre tel que l'appli l'affiche : ligne du tableur Livres (si lisible) complétée par le livre intégré.
async function livre(c, url, env) {
  const d = await integres(url, env);
  const integre = (d.livres || []).find(x => code(x.id) === c) || null;
  const lignes = await tableur(TABLEUR_LIVRES, env);
  let l = integre;
  // Une ligne du tableur remplace le livre intégré de même code ; sans ligne, le livre intégré reste affiché.
  const ligne = lignes && lignes.find(x => code(x.id) === c && (x.titre || faux(x.afficher)));
  if (ligne) {
    if (faux(ligne.afficher)) return null;
    l = Object.assign({}, integre || {}, ligne, { couverture: ligne.couverture || '' });
  }
  if (!l || faux(l.afficher)) return null;
  const prix = nombre(l.prix), prixNum = nombre(l.prix_num);
  return Object.assign(l, { id: c, prix, prix_num: prixNum, vente: vrai(l.vente) || (!faux(l.vente) && !!(prix || prixNum)), integre });
}

// Image d'aperçu d'un livre : couverture Drive du tableur, sinon carte 1200 × 630 préparée par couvertures.py.
function imageLivre(l, url) {
  const drive = idDrive(l.couverture);
  if (drive) return { src: 'https://lh3.googleusercontent.com/d/' + drive + '=w1200' };
  if (l.integre && l.integre.largeur) return { src: url.origin + '/assets/livres/' + l.id + '-og.jpg', l: 1200, h: 630 };
  return null;
}

export async function apercuLivre(c, url, env, en) {
  const l = await livre(c, url, env);
  if (!l) return null;
  const titre = l.titre || l.titre_fr || '';
  const image = imageLivre(l, url);
  const prix = !l.vente ? '' : l.prix ? fcfa(l.prix, en) : l.prix_num ? fcfa(l.prix_num, en) + (en ? ' (e-book)' : ' (numérique)') : '';
  const appel = l.vente ? (en ? 'Order on WhatsApp.' : 'Commandez sur WhatsApp.') : (en ? 'In the APEL Éditions library.' : 'Dans la bibliothèque d’APEL Éditions.');
  const resume = extrait((en && l.resume_en) || l.resume_fr || '', 160);
  return {
    titre: titre + (l.auteur ? ' — ' + l.auteur : ''),
    description: (prix ? prix + ' · ' : '') + appel + (resume ? ' ' + resume : ''),
    image, alt: (en ? 'Book cover: ' : 'Couverture du livre : ') + titre,
    cible: '/?' + parametres(url, 'livre', c)
  };
}

export async function apercuOffre(c, url, env, en) {
  const d = await integres(url, env);
  let p = (d.packs || []).find(x => x.id === c) || null;
  const lignes = await tableur(TABLEUR_OFFRES, env);
  if (lignes) {
    const ligne = lignes.find(x => x.id === c);
    if (ligne && faux(ligne.afficher)) return null;
    if (ligne) p = Object.assign({}, p || {}, ligne);
  }
  if (!p) return null;
  let prix = nombre(p.prix);
  let apartir = p.apartirde !== undefined && p.apartirde !== '' ? !faux(p.apartirde) : p.exact !== true;
  // Offre qui vend un livre : son prix et sa disponibilité viennent du livre, comme dans l'appli.
  const lie = (d.livres || []).find(x => String(x.offre_livre || '').split(/\s*[,;]\s*/)[0] === c);
  let image = null, alt = '';
  if (lie) {
    const l = await livre(code(lie.id), url, env);
    if (!l || !l.vente) return null;
    prix = l.prix; apartir = false;
    image = imageLivre(l, url);
    alt = (en ? 'Book cover: ' : 'Couverture du livre : ') + (l.titre || '');
  }
  const titre = (en && p.titre_en) || p.titre_fr || '';
  const unite = (en && p.unite_en) || p.unite_fr || '';
  const lignePrix = prix ? (apartir ? (en ? 'From ' : 'À partir de ') : '') + fcfa(prix, en) + (unite ? ' ' + unite : '') : (en ? 'Price on request' : 'Prix sur devis');
  const accroche = extrait((en && p.accroche_en) || p.accroche_fr || '', 170);
  return {
    titre: titre + ' · APEL Éditions',
    description: lignePrix + (accroche ? ' · ' + accroche : ''),
    image, alt,
    cible: '/?' + parametres(url, 'pack', c)
  };
}

// Paramètres transmis à l'appli : ceux du lien (src, lang, parrain…) plus le livre ou l'offre.
function parametres(url, nom, valeur) {
  const p = new URLSearchParams(url.search);
  p.delete('livre'); p.delete('pack');
  if (!p.has('src')) p.set('src', 'partage');
  p.set(nom, valeur);
  return p.toString();
}

const echapper = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function pageRelais(a, en) {
  const img = a.image || { src: a.origine + '/assets/apercu-partage.jpg', l: 1200, h: 630 };
  const cible = JSON.stringify(a.cible).replace(/</g, '\\u003c');
  return '<!doctype html><html lang="' + (en ? 'en' : 'fr') + '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#063D2C"><meta name="robots" content="noindex">' +
    '<title>' + echapper(a.titre) + '</title><meta name="description" content="' + echapper(a.description) + '">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="APEL Éditions">' +
    '<meta property="og:title" content="' + echapper(a.titre) + '"><meta property="og:description" content="' + echapper(a.description) + '">' +
    '<meta property="og:image" content="' + echapper(img.src) + '">' +
    (img.l ? '<meta property="og:image:width" content="' + img.l + '"><meta property="og:image:height" content="' + img.h + '">' : '') +
    (a.alt ? '<meta property="og:image:alt" content="' + echapper(a.alt) + '">' : '') +
    '<meta property="og:locale" content="' + (en ? 'en_GB' : 'fr_FR') + '"><meta name="twitter:card" content="summary_large_image">' +
    '<script>location.replace(' + cible + ');</script></head>' +
    '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#063D2C;color:#fff;font:16px/1.5 system-ui,sans-serif">' +
    '<p style="padding:24px;text-align:center"><a style="color:#FFD34D" href="' + echapper(a.cible) + '">' + echapper(en ? 'Open in the APEL Éditions app' : 'Ouvrir dans l’appli APEL Éditions') + '</a></p></body></html>';
}

export async function relais(context, type) {
  const url = new URL(context.request.url);
  const en = url.searchParams.get('lang') === 'en';
  const c = type === 'livre' ? code(context.params.code) : String(context.params.code || '').replace(/[^A-Za-z0-9-]/g, '');
  let a = null;
  try {
    a = c ? await (type === 'livre' ? apercuLivre(c, url, context.env, en) : apercuOffre(c, url, context.env, en)) : null;
  } catch (e) {
    a = null;
  }
  if (!a) {
    a = {
      titre: en ? 'APEL Éditions · Our offers in 1 minute' : 'APEL Éditions · Nos offres en 1 minute',
      description: en ? 'Publish a book, learn AI, communicate: find your package, see the prices and message us on WhatsApp.' : 'Publier un livre, se former à l’IA, communiquer : trouvez votre pack, voyez les prix et écrivez-nous sur WhatsApp.',
      image: null, alt: '', cible: '/?' + parametres(url, type === 'livre' ? 'livre' : 'pack', c)
    };
  }
  a.origine = url.origin;
  return new Response(pageRelais(a, en), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' }
  });
}
