/* Lecture d'un fichier Word (.docx) dans le navigateur, sans rien envoyer ailleurs :
   le texte est découpé en chapitres et mis en forme pour la liseuse du Salon.
   - Chapitres : paragraphes de style « Titre 1 » (Heading 1), sinon « Titre 2 »,
     sinon les lignes courtes qui commencent par « Chapitre », « Prologue », « Épilogue »…
   - Gardés : gras, italique, paragraphes centrés, citations (style « Citation » / Quote),
     séparateurs de scène (***, * * *, #), intertitres (Titre 2 ou 3 à l'intérieur d'un chapitre).
   Format d'un bloc : { s: 'p' | 'c' | 'q' | 'h' | 'sep', r: [[texte, 1 = gras + 2 = italique], …] } */
(function () {
'use strict';
var W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/* Fichier ZIP : répertoire central, puis chaque fichier décompressé par le navigateur */
function u16(d, i) { return d[i] | (d[i + 1] << 8); }
function u32(d, i) { return (d[i] | (d[i + 1] << 8) | (d[i + 2] << 16) | (d[i + 3] << 24)) >>> 0; }
function lireZip(buffer) {
  var d = new Uint8Array(buffer), fin = -1;
  for (var i = d.length - 22; i >= Math.max(0, d.length - 66000); i--) if (u32(d, i) === 0x06054b50) { fin = i; break; }
  if (fin < 0) throw new Error('Ce fichier n’est pas un document Word (.docx). Dans Word : Fichier > Enregistrer sous > Document Word (.docx).');
  var n = u16(d, fin + 10), p = u32(d, fin + 16), fichiers = {};
  for (var k = 0; k < n; k++) {
    if (u32(d, p) !== 0x02014b50) break;
    var methode = u16(d, p + 10), taille = u32(d, p + 20), lNom = u16(d, p + 28), lExtra = u16(d, p + 30), lCom = u16(d, p + 32), local = u32(d, p + 42);
    var nom = new TextDecoder().decode(d.subarray(p + 46, p + 46 + lNom));
    var debut = local + 30 + u16(d, local + 26) + u16(d, local + 28);
    fichiers[nom] = { methode: methode, donnees: d.subarray(debut, debut + taille) };
    p += 46 + lNom + lExtra + lCom;
  }
  return fichiers;
}
function extraire(f) {
  if (!f) return Promise.resolve(null);
  if (f.methode === 0) return Promise.resolve(new TextDecoder().decode(f.donnees));
  if (f.methode !== 8) return Promise.reject(new Error('Compression inconnue dans ce fichier Word.'));
  if (!window.DecompressionStream) return Promise.reject(new Error('Ce navigateur est trop ancien pour lire un fichier Word. Utilisez Chrome à jour.'));
  var flux = new Blob([f.donnees]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(flux).text();
}

/* Styles : nom lisible, niveau de plan et style parent */
function lireStyles(xml) {
  var styles = {};
  if (!xml) return styles;
  var doc = new DOMParser().parseFromString(xml, 'application/xml');
  [].forEach.call(doc.getElementsByTagNameNS(W, 'style'), function (s) {
    var id = s.getAttributeNS(W, 'styleId'), nom = enfant(s, 'name'), base = enfant(s, 'basedOn'), ppr = enfant(s, 'pPr'), niv = ppr && enfant(ppr, 'outlineLvl');
    styles[id] = { nom: nom ? val(nom) : id, base: base ? val(base) : '', niveau: niv ? parseInt(val(niv), 10) : null };
  });
  return styles;
}
function enfant(el, nom) { for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (c.namespaceURI === W && c.localName === nom) return c; return null; }
function val(el) { return el.getAttributeNS(W, 'val') || el.getAttribute('w:val') || ''; }
function actif(el) { if (!el) return false; var v = val(el); return v === '' || !/^(0|false|none)$/i.test(v); }
// Niveau de titre (1 = Titre 1…) d'un style, en remontant ses parents ; 0 = titre du document ; null = paragraphe.
function niveauStyle(styles, id, prof) {
  var s = styles[id];
  if (!s || (prof || 0) > 8) return null;
  var nom = (s.nom + ' ' + id).toLowerCase().replace(/\s+/g, ' ');
  if (/(^| )(title|titre)( |$)/.test(nom) && !/\d/.test(nom)) return 0;
  var m = nom.match(/(heading|titre) ?(\d)/);
  if (m) return parseInt(m[2], 10);
  if (s.niveau != null) return s.niveau < 9 ? s.niveau + 1 : null;
  return s.base ? niveauStyle(styles, s.base, (prof || 0) + 1) : null;
}
function estCitation(styles, id) { var s = styles[id]; return !!s && /quote|citation|cita/i.test(s.nom + ' ' + id); }

/* Paragraphes du document, dans l'ordre (y compris dans les tableaux, sans les doublons des zones de texte) */
function paragraphes(xml, styles) {
  var doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Le contenu du fichier Word est illisible.');
  var res = [];
  [].forEach.call(doc.getElementsByTagNameNS(W, 'p'), function (p) {
    for (var a = p.parentNode; a; a = a.parentNode) if (a.localName === 'Fallback' || a.localName === 'del') return;
    var ppr = enfant(p, 'pPr'), sid = ppr && enfant(ppr, 'pStyle') ? val(enfant(ppr, 'pStyle')) : '';
    // Niveau de plan 9 = corps de texte.
    var ol = ppr && enfant(ppr, 'outlineLvl') ? parseInt(val(enfant(ppr, 'outlineLvl')), 10) : null;
    var lvl = ol != null ? (ol < 9 ? ol + 1 : null) : niveauStyle(styles, sid);
    var jc = ppr && enfant(ppr, 'jc') ? val(enfant(ppr, 'jc')) : '';
    var runs = [];
    (function parcourir(el) {
      for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
        if (c.localName === 'pPr' || c.localName === 'del' || c.localName === 'rPr') continue;
        if (c.localName === 'r' && c.namespaceURI === W) {
          var rpr = enfant(c, 'rPr'), f = 0;
          if (rpr && actif(enfant(rpr, 'b'))) f |= 1;
          if (rpr && actif(enfant(rpr, 'i'))) f |= 2;
          if (rpr && enfant(rpr, 'vanish')) continue;
          var texte = '';
          for (var t = c.firstElementChild; t; t = t.nextElementSibling) {
            if (t.localName === 't') texte += t.textContent;
            else if (t.localName === 'tab') texte += ' ';
            else if (t.localName === 'br' && !/page|column/.test(t.getAttributeNS(W, 'type') || '')) texte += '\n';
            else if (t.localName === 'cr') texte += '\n';
            else if (t.localName === 'noBreakHyphen') texte += '-';
          }
          if (texte) { var der = runs[runs.length - 1]; if (der && der[1] === f) der[0] += texte; else runs.push([texte, f]); }
        } else if (c.localName !== 'footnoteReference' && c.localName !== 'endnoteReference' && c.localName !== 'txbxContent') parcourir(c);
      }
    })(p);
    // Espaces en trop au début et à la fin du paragraphe
    if (runs.length) { runs[0][0] = runs[0][0].replace(/^\s+/, ''); var z = runs[runs.length - 1]; z[0] = z[0].replace(/\s+$/, ''); }
    runs = runs.filter(function (r) { return r[0]; });
    var texteP = runs.map(function (r) { return r[0]; }).join('');
    if (!texteP.trim()) return;
    res.push({ texte: texteP, runs: runs, niveau: lvl, centre: jc === 'center', citation: estCitation(styles, sid) });
  });
  return res;
}

var MOT_CHAPITRE = /^\s*(chapitre|chapter|chap\.|partie|prologue|[ée]pilogue|epilogue|introduction|avant-propos)\b/i;
function compterMots(t) { return (t.match(/[A-Za-zÀ-ÿ0-9]+(?:['’-][A-Za-zÀ-ÿ0-9]+)*/g) || []).length; }
function bloc(p, sousTitre) {
  if (/^[\s*#~•·—–_=-]{1,20}$/.test(p.texte) && /[*#~•·]/.test(p.texte)) return { s: 'sep' };
  var r = p.runs.map(function (x) { return x[1] ? [x[0], x[1]] : [x[0]]; });
  if (sousTitre) return { s: 'h', r: r.map(function (x) { return [x[0]]; }) };
  return { s: p.citation ? 'q' : p.centre ? 'c' : 'p', r: r };
}

// Découpe en chapitres. Renvoie { titre (titre du document s'il y en a un), chapitres: [{ titre, blocs, mots, avant }] }.
function decouper(ps, nomFichier) {
  var niveaux = ps.map(function (p) { return p.niveau; }).filter(function (n) { return n >= 1; });
  var coupe = niveaux.length ? Math.min.apply(null, niveaux) : null;
  var titreDoc = '', chapitres = [], cour = null;
  ps.forEach(function (p) {
    if (p.niveau === 0 && !titreDoc && !chapitres.length && !cour) { titreDoc = p.texte.trim(); return; }
    var debut = coupe ? p.niveau === coupe : (MOT_CHAPITRE.test(p.texte) && p.texte.length < 100);
    if (debut) { cour = { titre: p.texte.replace(/\s+/g, ' ').trim().slice(0, 160), blocs: [] }; chapitres.push(cour); return; }
    if (!cour) { cour = { titre: '', blocs: [], avant: true }; chapitres.push(cour); }
    cour.blocs.push(bloc(p, coupe && p.niveau > coupe));
  });
  chapitres.forEach(function (c, i) {
    c.mots = c.blocs.reduce(function (s, b) { return s + (b.r ? b.r.reduce(function (t, x) { return t + compterMots(x[0]); }, 0) : 0); }, 0);
    if (c.avant) c.titre = chapitres.length === 1 ? String(nomFichier || 'Chapitre 1').replace(/\.docx$/i, '').replace(/[_]+/g, ' ').trim() : 'Début du document';
  });
  // Un « chapitre » qui n'est qu'un titre (ex. « Partie 1 » suivi de « Chapitre 1 ») ne garde pas de page vide.
  chapitres = chapitres.filter(function (c) { return c.blocs.length || c.avant; });
  return { titre: titreDoc, chapitres: chapitres };
}

window.APEL_WORD = {
  lire: function (fichier) {
    return (fichier.arrayBuffer ? fichier.arrayBuffer() : new Response(fichier).arrayBuffer()).then(function (buf) {
      var z = lireZip(buf);
      if (!z['word/document.xml']) throw new Error('Ce fichier n’est pas un document Word (.docx).');
      return Promise.all([extraire(z['word/document.xml']), extraire(z['word/styles.xml'])]);
    }).then(function (x) {
      var res = decouper(paragraphes(x[0], lireStyles(x[1])), fichier.name);
      if (!res.chapitres.length) throw new Error('Ce fichier Word ne contient pas de texte.');
      return res;
    });
  },
  decouper: decouper
};
})();
