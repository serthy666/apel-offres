/* Lecture des textes dans le navigateur, sans rien envoyer ailleurs : le texte est découpé en chapitres
   et mis en forme pour la liseuse du Salon.
   Formats : Word (.docx), LibreOffice (.odt), livre numérique (.epub), PDF (.pdf), RTF (.rtf),
   page web (.html), texte simple (.txt), Markdown (.md), ou texte collé.
   - Chapitres : titres de niveau 1 (« Titre 1 », Heading 1, # en Markdown, <h1>…), sinon niveau 2,
     sinon les lignes courtes qui commencent par « Chapitre », « Prologue », « Épilogue »…
   - Gardés : gras, italique, paragraphes centrés, citations, séparateurs de scène (***, * * *, #),
     retours à la ligne des poèmes, intertitres.
   Format d'un bloc : { s: 'p' | 'c' | 'q' | 'h' | 'sep', r: [[texte, 1 = gras + 2 = italique], …] } */
(function () {
'use strict';
var W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
var NS_TEXT = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0', NS_STYLE = 'urn:oasis:names:tc:opendocument:xmlns:style:1.0', NS_FO = 'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0';
var FORMATS = 'Word (.docx), LibreOffice (.odt), EPUB, PDF, RTF, HTML, texte (.txt) ou Markdown (.md)';

/* Un paragraphe lu dans le fichier : texte, morceaux mis en forme, niveau de titre (0 = titre du document, 1 = chapitre…) */
function para(runs, o) {
  o = o || {};
  var propres = [];
  runs.forEach(function (r) { if (!r[0]) return; var d = propres[propres.length - 1]; if (d && d[1] === r[1]) d[0] += r[0]; else propres.push([r[0], r[1] || 0]); });
  if (propres.length) { propres[0][0] = propres[0][0].replace(/^\s+/, ''); var z = propres[propres.length - 1]; z[0] = z[0].replace(/\s+$/, ''); }
  propres = propres.filter(function (r) { return r[0]; });
  var texte = propres.map(function (r) { return r[0]; }).join('');
  if (!texte.trim()) return null;
  return { texte: texte, runs: propres, niveau: o.niveau == null ? null : o.niveau, centre: !!o.centre, citation: !!o.citation };
}
function pousser(liste, p) { if (p) liste.push(p); }

/* ---------- Fichier ZIP (docx, odt, epub) ---------- */
function u16(d, i) { return d[i] | (d[i + 1] << 8); }
function u32(d, i) { return (d[i] | (d[i + 1] << 8) | (d[i + 2] << 16) | (d[i + 3] << 24)) >>> 0; }
function lireZip(buffer, quoi) {
  var d = new Uint8Array(buffer), fin = -1;
  for (var i = d.length - 22; i >= Math.max(0, d.length - 66000); i--) if (u32(d, i) === 0x06054b50) { fin = i; break; }
  if (fin < 0) throw new Error('Ce fichier n’est pas un ' + quoi + ' valide. Réenregistrez-le, ou choisissez un autre format : ' + FORMATS + '.');
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
  if (f.methode !== 8) return Promise.reject(new Error('Compression inconnue dans ce fichier.'));
  if (!window.DecompressionStream) return Promise.reject(new Error('Ce navigateur est trop ancien pour lire ce fichier. Utilisez Chrome à jour.'));
  var flux = new Blob([f.donnees]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(flux).text();
}
function xml(texte, quoi) {
  var doc = new DOMParser().parseFromString(texte, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Le contenu du fichier ' + quoi + ' est illisible.');
  return doc;
}
function enfantNS(el, ns, nom) { for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (c.namespaceURI === ns && c.localName === nom) return c; return null; }
// Niveau de titre d'après le nom d'un style (Word, LibreOffice, RTF) : 0 = titre du document.
function niveauNom(nom) {
  nom = String(nom || '').toLowerCase().replace(/_20_/g, ' ').replace(/[_\s]+/g, ' ');
  if (/(^| )(title|titre)( |$)/.test(nom) && !/\d/.test(nom) && !/sous|sub/.test(nom)) return 0;
  var m = nom.match(/(heading|titre) ?(\d)/);
  return m ? parseInt(m[2], 10) : null;
}
function nomCitation(nom) { return /quot|citation|cita/i.test(String(nom || '')); }

/* ---------- Word (.docx) ---------- */
function val(el) { return el.getAttributeNS(W, 'val') || el.getAttribute('w:val') || ''; }
function actif(el) { if (!el) return false; var v = val(el); return v === '' || !/^(0|false|none)$/i.test(v); }
function enfant(el, nom) { return enfantNS(el, W, nom); }
function stylesWord(texte) {
  var styles = {};
  if (!texte) return styles;
  [].forEach.call(xml(texte, 'Word').getElementsByTagNameNS(W, 'style'), function (s) {
    var id = s.getAttributeNS(W, 'styleId'), nom = enfant(s, 'name'), base = enfant(s, 'basedOn'), ppr = enfant(s, 'pPr'), niv = ppr && enfant(ppr, 'outlineLvl');
    styles[id] = { nom: nom ? val(nom) : id, base: base ? val(base) : '', niveau: niv ? parseInt(val(niv), 10) : null };
  });
  return styles;
}
function niveauStyleWord(styles, id, prof) {
  var s = styles[id];
  if (!s || (prof || 0) > 8) return null;
  var n = niveauNom(s.nom + ' ' + id);
  if (n != null) return n;
  if (s.niveau != null) return s.niveau < 9 ? s.niveau + 1 : null;
  return s.base ? niveauStyleWord(styles, s.base, (prof || 0) + 1) : null;
}
function lireDocx(z) {
  if (!z['word/document.xml']) throw new Error('Ce fichier n’est pas un document Word (.docx).');
  return Promise.all([extraire(z['word/document.xml']), extraire(z['word/styles.xml'])]).then(function (x) {
    var styles = stylesWord(x[1]), res = [];
    [].forEach.call(xml(x[0], 'Word').getElementsByTagNameNS(W, 'p'), function (p) {
      for (var a = p.parentNode; a; a = a.parentNode) if (a.localName === 'Fallback' || a.localName === 'del') return;
      var ppr = enfant(p, 'pPr'), sid = ppr && enfant(ppr, 'pStyle') ? val(enfant(ppr, 'pStyle')) : '';
      // Niveau de plan 9 = corps de texte.
      var ol = ppr && enfant(ppr, 'outlineLvl') ? parseInt(val(enfant(ppr, 'outlineLvl')), 10) : null;
      var lvl = ol != null ? (ol < 9 ? ol + 1 : null) : niveauStyleWord(styles, sid);
      var jc = ppr && enfant(ppr, 'jc') ? val(enfant(ppr, 'jc')) : '';
      var runs = [];
      (function parcourir(el) {
        for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
          if (c.localName === 'pPr' || c.localName === 'del' || c.localName === 'rPr') continue;
          if (c.localName === 'r' && c.namespaceURI === W) {
            var rpr = enfant(c, 'rPr'), f = 0;
            if (rpr && enfant(rpr, 'vanish')) continue;
            if (rpr && actif(enfant(rpr, 'b'))) f |= 1;
            if (rpr && actif(enfant(rpr, 'i'))) f |= 2;
            var texte = '';
            for (var t = c.firstElementChild; t; t = t.nextElementSibling) {
              if (t.localName === 't') texte += t.textContent;
              else if (t.localName === 'tab') texte += ' ';
              else if (t.localName === 'br' && !/page|column/.test(t.getAttributeNS(W, 'type') || '')) texte += '\n';
              else if (t.localName === 'cr') texte += '\n';
              else if (t.localName === 'noBreakHyphen') texte += '-';
            }
            runs.push([texte, f]);
          } else if (c.localName !== 'footnoteReference' && c.localName !== 'endnoteReference' && c.localName !== 'txbxContent') parcourir(c);
        }
      })(p);
      var s = styles[sid];
      pousser(res, para(runs, { niveau: lvl, centre: jc === 'center', citation: !!s && nomCitation(s.nom + ' ' + sid) }));
    });
    return res;
  });
}

/* ---------- LibreOffice / OpenDocument (.odt) ---------- */
function stylesOdt(docs) {
  var styles = {};
  docs.forEach(function (d) {
    if (!d) return;
    [].forEach.call(d.getElementsByTagNameNS(NS_STYLE, 'style'), function (s) {
      var tp = enfantNS(s, NS_STYLE, 'text-properties'), pp = enfantNS(s, NS_STYLE, 'paragraph-properties');
      styles[s.getAttributeNS(NS_STYLE, 'name')] = {
        nom: s.getAttributeNS(NS_STYLE, 'display-name') || s.getAttributeNS(NS_STYLE, 'name'),
        parent: s.getAttributeNS(NS_STYLE, 'parent-style-name') || '',
        gras: tp ? /bold|[6-9]00/.test(tp.getAttributeNS(NS_FO, 'font-weight')) : null,
        italique: tp ? /italic|oblique/.test(tp.getAttributeNS(NS_FO, 'font-style')) : null,
        centre: pp ? pp.getAttributeNS(NS_FO, 'text-align') === 'center' : null
      };
    });
  });
  return styles;
}
// Propriété d'un style en remontant ses parents
function propOdt(styles, nom, k, prof) {
  var s = styles[nom];
  if (!s || (prof || 0) > 8) return null;
  if (k === 'niveau') { var n = niveauNom(s.nom); if (n != null) return n; }
  else if (k === 'citation') { if (nomCitation(s.nom)) return true; }
  else if (s[k] != null) return s[k];
  return s.parent ? propOdt(styles, s.parent, k, (prof || 0) + 1) : null;
}
function lireOdt(z) {
  if (!z['content.xml']) throw new Error('Ce fichier n’est pas un document LibreOffice (.odt).');
  return Promise.all([extraire(z['content.xml']), extraire(z['styles.xml'])]).then(function (x) {
    var contenu = xml(x[0], 'LibreOffice'), styles = stylesOdt([x[1] ? xml(x[1], 'LibreOffice') : null, contenu]), res = [];
    function morceaux(el, f, runs) {
      for (var c = el.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { runs.push([c.nodeValue.replace(/\s+/g, ' '), f]); continue; }
        if (c.nodeType !== 1 || c.namespaceURI !== NS_TEXT) { if (c.nodeType === 1 && c.localName !== 'frame') morceaux(c, f, runs); continue; }
        var n = c.localName;
        if (n === 's') runs.push([new Array((parseInt(c.getAttributeNS(NS_TEXT, 'c'), 10) || 1) + 1).join(' '), f]);
        else if (n === 'tab') runs.push([' ', f]);
        else if (n === 'line-break') runs.push(['\n', f]);
        else if (n === 'note' || n === 'bookmark' || n === 'bookmark-start' || n === 'bookmark-end' || n === 'soft-page-break' || n === 'annotation') continue;
        else if (n === 'span') {
          var st = c.getAttributeNS(NS_TEXT, 'style-name'), g = f;
          var b = propOdt(styles, st, 'gras'), i = propOdt(styles, st, 'italique');
          if (b != null) g = b ? g | 1 : g & ~1;
          if (i != null) g = i ? g | 2 : g & ~2;
          morceaux(c, g, runs);
        } else morceaux(c, f, runs);
      }
      return runs;
    }
    (function blocs(el) {
      for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
        if (c.namespaceURI === NS_TEXT && (c.localName === 'p' || c.localName === 'h')) {
          var st = c.getAttributeNS(NS_TEXT, 'style-name');
          var niv = c.localName === 'h' ? (parseInt(c.getAttributeNS(NS_TEXT, 'outline-level'), 10) || 1) : propOdt(styles, st, 'niveau');
          if (c.localName === 'h' && propOdt(styles, st, 'niveau') === 0) niv = 0;
          pousser(res, para(morceaux(c, 0, []), { niveau: niv, centre: !!propOdt(styles, st, 'centre'), citation: !!propOdt(styles, st, 'citation') }));
        } else if (c.localName !== 'tracked-changes' && c.localName !== 'sequence-decls' && c.localName !== 'variable-decls') blocs(c);
      }
    })(contenu.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:office:1.0', 'text')[0] || contenu.documentElement);
    return res;
  });
}

/* ---------- Pages web (.html) et livres numériques (.epub) ---------- */
var BLOCS = /^(p|div|section|article|main|body|blockquote|ul|ol|li|dl|dt|dd|pre|figure|figcaption|header|footer|aside|table|tbody|thead|tr|td|th|center|h[1-6]|hr)$/i;
// Classes CSS de la page (.T1 { font-weight: bold }…) : gras, italique, centrage.
function classesCss(doc, cssEnPlus) {
  var cl = {};
  [].map.call(doc.getElementsByTagName('style'), function (st) { return st.textContent; }).concat(cssEnPlus || []).forEach(function (css) {
    var re = /([^{}]+)\{([^}]*)\}/g, m;
    while ((m = re.exec(css))) {
      var props = m[2], o = {};
      if (/font-weight\s*:\s*(bold|[6-9]00)/i.test(props)) o.gras = true;
      if (/font-style\s*:\s*(italic|oblique)/i.test(props)) o.italique = true;
      if (/text-align\s*:\s*center/i.test(props)) o.centre = true;
      if (/font-weight\s*:\s*(normal|[1-4]00)/i.test(props)) o.gras = false;
      if (/font-style\s*:\s*normal/i.test(props)) o.italique = false;
      m[1].split(',').forEach(function (sel) { var c = sel.trim().match(/\.([\w-]+)$/); if (c) cl[c[1]] = Object.assign(cl[c[1]] || {}, o); });
    }
  });
  return cl;
}
function propClasse(el, cl, k) {
  var r = null;
  String(el.getAttribute('class') || '').split(/\s+/).forEach(function (c) { if (cl[c] && cl[c][k] != null) r = cl[c][k]; });
  return r;
}
function centreEl(el, cl) {
  var s = (el.getAttribute('style') || '') + ' ' + (el.getAttribute('align') || '') + ' ' + (el.getAttribute('class') || '');
  return /text-align\s*:\s*center|(^|\s)(center|centre|centered|centrer)(\s|$)/i.test(s) || /^center$/i.test(el.localName) || propClasse(el, cl || {}, 'centre') === true;
}
function paragraphesHtml(racine, cl) {
  var res = [];
  cl = cl || {};
  function morceaux(el, f, runs, pre) {
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { runs.push([pre ? c.nodeValue : c.nodeValue.replace(/\s+/g, ' '), f]); continue; }
      if (c.nodeType !== 1) continue;
      var n = c.localName.toLowerCase();
      if (n === 'br') { runs.push(['\n', f]); continue; }
      if (/^(script|style|img|svg|sup|audio|video|noscript)$/.test(n)) continue;
      var g = f, cg = propClasse(c, cl, 'gras'), ci = propClasse(c, cl, 'italique');
      if (/^(b|strong)$/.test(n) || /font-weight\s*:\s*(bold|[6-9]00)/i.test(c.getAttribute('style') || '') || cg === true) g |= 1;
      if (/^(i|em|cite)$/.test(n) || /font-style\s*:\s*italic/i.test(c.getAttribute('style') || '') || ci === true) g |= 2;
      morceaux(c, g, runs, pre || n === 'pre');
    }
    return runs;
  }
  function aDesBlocs(el) { for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (BLOCS.test(c.localName)) return true; return false; }
  (function blocs(el, citation, centre) {
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
      var n = c.localName.toLowerCase();
      if (/^(script|style|nav|head|noscript|svg)$/.test(n) || (c.getAttribute('epub:type') || '').indexOf('toc') >= 0) continue;
      var cite = citation || n === 'blockquote', ctr = centre || centreEl(c, cl);
      if (/^h[1-6]$/.test(n)) { pousser(res, para(morceaux(c, 0, []), { niveau: parseInt(n[1], 10), centre: ctr })); continue; }
      if (n === 'hr') { res.push(para([['* * *', 0]])); continue; }
      if (aDesBlocs(c)) { blocs(c, cite, ctr); continue; }
      if (BLOCS.test(n) || n === 'span' || n === 'a' || n === 'font') pousser(res, para(morceaux(c, 0, [], n === 'pre'), { centre: ctr, citation: cite }));
    }
  })(racine, false, false);
  return res;
}
function docHtml(texte) {
  var d = new DOMParser().parseFromString(texte, 'application/xhtml+xml');
  if (d.getElementsByTagName('parsererror').length || !d.body) d = new DOMParser().parseFromString(texte, 'text/html');
  return d;
}
function lireHtml(texte) {
  var d = new DOMParser().parseFromString(texte, 'text/html'), res = [];
  var titre = d.querySelector('title');
  if (titre && titre.textContent.trim() && !d.querySelector('h1')) res.push(para([[titre.textContent.trim(), 0]], { niveau: 0 }));
  return res.concat(paragraphesHtml(d.body || d.documentElement, classesCss(d)));
}
function chemin(base, href) {
  var parts = (base ? base.split('/').slice(0, -1) : []).concat(decodeURIComponent(href.split('#')[0]).split('/'));
  var r = []; parts.forEach(function (x) { if (x === '..') r.pop(); else if (x && x !== '.') r.push(x); });
  return r.join('/');
}
function lireEpub(z) {
  if (!z['META-INF/container.xml']) throw new Error('Ce fichier n’est pas un livre numérique EPUB.');
  return extraire(z['META-INF/container.xml']).then(function (c) {
    var rf = xml(c, 'EPUB').getElementsByTagName('rootfile')[0];
    var opfChemin = rf && rf.getAttribute('full-path');
    if (!opfChemin || !z[opfChemin]) throw new Error('Livre EPUB incomplet.');
    return extraire(z[opfChemin]).then(function (o) {
      var opf = xml(o, 'EPUB'), items = {}, css = [], nav = null, ncx = null;
      [].forEach.call(opf.getElementsByTagName('item'), function (it) {
        items[it.getAttribute('id')] = it;
        var ch = chemin(opfChemin, it.getAttribute('href') || ''), type = it.getAttribute('media-type') || '';
        if (type === 'text/css') css.push(ch);
        if (/nav/.test(it.getAttribute('properties') || '')) nav = ch;
        if (/ncx/.test(type)) ncx = ch;
      });
      var titreLivre = ((opf.getElementsByTagName('dc:title')[0] || opf.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', 'title')[0] || {}).textContent || '').trim();
      if (/^(unknown title|sans titre|untitled)$/i.test(titreLivre)) titreLivre = '';
      var docs = [].map.call(opf.getElementsByTagName('itemref'), function (r) {
        var it = items[r.getAttribute('idref')];
        if (!it || r.getAttribute('linear') === 'no' || /nav/.test(it.getAttribute('properties') || '') || !/html/.test(it.getAttribute('media-type') || '')) return null;
        return chemin(opfChemin, it.getAttribute('href'));
      }).filter(function (x) { return x && z[x]; });
      var aLire = docs.concat(css, nav ? [nav] : [], ncx ? [ncx] : []);
      return Promise.all(aLire.map(function (d) { return extraire(z[d]); })).then(function (textes) {
        var feuilles = textes.slice(docs.length, docs.length + css.length);
        // Sommaire du livre : titre du premier chapitre de chaque fichier
        var sommaire = {};
        function noter(href, base, titre) { var f = chemin(base, href || ''); titre = String(titre || '').replace(/\s+/g, ' ').trim(); if (f && titre && !sommaire[f]) sommaire[f] = titre; }
        if (nav && textes[docs.length + css.length]) [].forEach.call(docHtml(textes[docs.length + css.length]).querySelectorAll('nav a[href]'), function (a) { noter(a.getAttribute('href'), nav, a.textContent); });
        var tNcx = textes[docs.length + css.length + (nav ? 1 : 0)];
        if (ncx && tNcx) [].forEach.call(xml(tNcx, 'EPUB').getElementsByTagName('navPoint'), function (np) { var t = np.getElementsByTagName('text')[0], ct = np.getElementsByTagName('content')[0]; if (t && ct) noter(ct.getAttribute('src'), ncx, t.textContent); });
        var res = titreLivre ? [para([[titreLivre, 0]], { niveau: 0 })] : [];
        textes.slice(0, docs.length).forEach(function (t, i) {
          var d = docHtml(t), ps = paragraphesHtml(d.body || d.documentElement, classesCss(d, feuilles));
          var lettres = ps.reduce(function (s, p) { return s + p.texte.length; }, 0);
          // Fichier sans titre (un chapitre par fichier) : son titre vient du sommaire, sinon du titre de la page.
          if (!ps.some(function (p) { return p.niveau >= 1 && p.niveau <= 2; }) && ((sommaire[docs[i]] && lettres > 150) || lettres > 300)) {
            var tt = d.querySelector('title'), titre = sommaire[docs[i]] || (tt && tt.textContent.trim() !== titreLivre ? tt.textContent.trim() : '') || 'Partie ' + (i + 1);
            if (ps[0] && ps[0].texte.replace(/\s+/g, ' ').trim() === titre) ps.shift();
            res.push(para([[titre, 0]], { niveau: 1 }));
          }
          ps.forEach(function (p) { res.push(p); });
        });
        return res;
      });
    });
  });
}

/* ---------- RTF ---------- */
var RTF_IGNORE = /^(fonttbl|colortbl|info|pict|header|headerl|headerr|headerf|footer|footerl|footerr|footerf|footnote|listtable|listoverridetable|themedata|colorschememapping|datastore|latentstyles|xmlnsdecls|generator|rsidtbl|mmathPr|filetbl|revtbl|object|shp|nonshppict|fldinst|bkmkstart|bkmkend|pgdsctbl|annotation)$/;
var RTF_CAR = { emdash: '—', endash: '–', lquote: '‘', rquote: '’', ldblquote: '“', rdblquote: '”', bullet: '•', tab: ' ', line: '\n', emspace: ' ', enspace: ' ', qmspace: ' ' };
function lireRtf(octets) {
  var t = new TextDecoder('latin1').decode(octets);
  if (!/^\{\\rtf/.test(t)) throw new Error('Ce fichier n’est pas un document RTF.');
  var cp = new TextDecoder('windows-1252');
  var res = [], runs = [], e = { b: 0, i: 0, ignore: false, uc: 1, dest: '' }, pile = [], ppr = { centre: false, niveau: null, style: null }, sauter = 0;
  var noms = {}, nomStyle = '', numStyle = null;
  function fin() { var s = ppr.style != null ? noms[ppr.style] : ''; pousser(res, para(runs, { centre: ppr.centre, niveau: ppr.niveau != null ? ppr.niveau : niveauNom(s), citation: nomCitation(s) })); runs = []; }
  function car(c) {
    if (sauter > 0) { sauter--; return; }
    if (e.dest === 'stylesheet') { if (c === ';') { if (numStyle != null) noms[numStyle] = nomStyle.trim(); nomStyle = ''; } else nomStyle += c; return; }
    if (!e.ignore) runs.push([c, (e.b ? 1 : 0) | (e.i ? 2 : 0)]);
  }
  for (var i = 0; i < t.length; i++) {
    var c = t[i];
    if (c === '{') { pile.push({ b: e.b, i: e.i, ignore: e.ignore, uc: e.uc, dest: e.dest }); if (e.dest === 'stylesheet') { numStyle = 0; nomStyle = ''; } continue; }
    if (c === '}') { e = pile.pop() || e; continue; }
    if (c === '\r' || c === '\n') continue;
    if (c !== '\\') { car(c); continue; }
    var s = t[i + 1];
    if (s === '\'') { car(cp.decode(new Uint8Array([parseInt(t.substr(i + 2, 2), 16)]))); i += 3; continue; }
    if (s === '\\' || s === '{' || s === '}') { car(s); i++; continue; }
    if (s === '~') { car(' '); i++; continue; }
    if (s === '_') { car('-'); i++; continue; }
    if (s === '-') { i++; continue; }
    if (s === '*') { e.ignore = true; i++; continue; }
    if (s === '\n' || s === '\r') { if (!e.ignore) fin(); i++; continue; }
    var m = /^([a-zA-Z]+)(-?\d+)? ?/.exec(t.substr(i + 1, 40));
    if (!m) { i++; continue; }
    i += m[0].length;
    var mot = m[1], p = m[2] != null ? parseInt(m[2], 10) : null;
    if (RTF_IGNORE.test(mot)) { e.ignore = true; continue; }
    if (mot === 'stylesheet') { e.dest = 'stylesheet'; continue; }
    if (e.dest === 'stylesheet') { if (mot === 's' || mot === 'cs' || mot === 'ds') numStyle = (mot === 's' ? '' : mot) + p; continue; }
    switch (mot) {
      case 'par': case 'sect': if (!e.ignore) fin(); break;
      case 'pard': ppr = { centre: false, niveau: null, style: null }; break;
      case 'plain': e.b = 0; e.i = 0; break;
      case 'b': e.b = p !== 0; break;
      case 'i': e.i = p !== 0; break;
      case 'qc': ppr.centre = true; break;
      case 'ql': case 'qr': case 'qj': ppr.centre = false; break;
      case 's': ppr.style = String(p); break;
      case 'outlinelevel': ppr.niveau = p < 9 ? p + 1 : null; break;
      case 'uc': e.uc = p || 0; break;
      case 'u': car(String.fromCharCode(p < 0 ? p + 65536 : p)); sauter = e.uc; break;
      default: if (RTF_CAR[mot]) car(RTF_CAR[mot]);
    }
  }
  fin();
  return res;
}

/* ---------- Texte simple (.txt), Markdown (.md) et texte collé ---------- */
function decoder(octets) {
  var t = new TextDecoder('utf-8').decode(octets);
  return t.indexOf('�') >= 0 ? new TextDecoder('windows-1252').decode(octets) : t;
}
function enLigne(t) {
  // **gras**, __gras__, *italique*, _italique_
  var runs = [], re = /(\*\*|__)(.+?)\1|(\*|_)(?!\s)(.+?)\3(?![\w])/g, d = 0, m;
  while ((m = re.exec(t))) {
    if (m.index > d) runs.push([t.slice(d, m.index), 0]);
    runs.push(m[2] != null ? [m[2], 1] : [m[4], 2]);
    d = re.lastIndex;
  }
  if (d < t.length) runs.push([t.slice(d), 0]);
  return runs;
}
function lireTexte(t, markdown) {
  t = String(t).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  var lignes = t.split('\n');
  var vides = lignes.filter(function (l) { return !l.trim(); }).length;
  // Fichier sans lignes vides : chaque ligne est un paragraphe.
  var parLigne = vides < lignes.length / 10;
  var groupes = parLigne ? lignes.map(function (l) { return [l]; }) : t.split(/\n\s*\n/).map(function (g) { return g.split('\n'); });
  var res = [];
  groupes.forEach(function (g) {
    g = g.filter(function (l) { return l.trim(); });
    if (!g.length) return;
    var premiere = g[0].trim();
    if (markdown && /^#{1,6}\s/.test(premiere) && g.length === 1) { var n = premiere.match(/^#+/)[0].length; pousser(res, para(enLigne(premiere.replace(/^#+\s*/, '').replace(/\s*#+$/, '')), { niveau: n })); return; }
    if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$|^#$|^~+$/.test(premiere) && g.length === 1) { res.push(para([['* * *', 0]])); return; }
    var citation = markdown && g.every(function (l) { return /^\s*>/.test(l); });
    if (citation) g = g.map(function (l) { return l.replace(/^\s*>\s?/, ''); });
    // Poème ou dialogue en lignes courtes : on garde les retours à la ligne.
    var courtes = g.filter(function (l) { return l.trim().length < 60; }).length;
    var texte = g.length > 1 && courtes >= g.length * 0.7 ? g.map(function (l) { return l.trim(); }).join('\n') : g.map(function (l) { return l.trim(); }).join(' ').replace(/(\w)- (\w)/g, '$1$2');
    pousser(res, para(markdown ? enLigne(texte) : [[texte, 0]], { citation: citation }));
  });
  return res;
}

/* ---------- PDF (pdf.js, copié dans vendor/pdfjs) ---------- */
var pdfjs = null;
function chargerPdfjs() {
  if (pdfjs) return pdfjs;
  pdfjs = new Promise(function (ok, ko) {
    if (window.pdfjsLib) { ok(window.pdfjsLib); return; }
    var s = document.createElement('script'); s.src = 'vendor/pdfjs/pdf.min.js';
    s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js'; ok(window.pdfjsLib); };
    s.onerror = function () { pdfjs = null; ko(new Error('Impossible de charger le lecteur de PDF. Vérifiez la connexion internet.')); };
    document.head.appendChild(s);
  });
  return pdfjs;
}
function mediane(l) { if (!l.length) return 0; l = l.slice().sort(function (a, b) { return a - b; }); return l[Math.floor(l.length / 2)]; }
function lirePdf(octets) {
  return chargerPdfjs().then(function (lib) {
    return lib.getDocument({ data: octets, isEvalSupported: false }).promise;
  }).then(function (doc) {
    var pages = [];
    for (var n = 1; n <= doc.numPages; n++) pages.push(n);
    return Promise.all(pages.map(function (n) {
      return doc.getPage(n).then(function (pg) {
        var vue = pg.getViewport({ scale: 1 });
        return pg.getTextContent().then(function (tc) {
          var lignes = [], cour = null;
          tc.items.forEach(function (it) {
            if (it.str == null) return;
            var x = it.transform[4], y = it.transform[5], h = Math.abs(it.transform[3]) || it.height || 10;
            if (!cour || Math.abs(y - cour.y) > h * 0.5) { cour = { y: y, x: x, fin: x + it.width, h: h, texte: '' }; lignes.push(cour); }
            else if (x - cour.fin > h * 0.15 && !/\s$/.test(cour.texte) && !/^\s/.test(it.str)) cour.texte += ' ';
            cour.texte += it.str; cour.fin = Math.max(cour.fin, x + it.width); cour.x = Math.min(cour.x, x); cour.h = Math.max(cour.h, h);
            if (it.hasEOL) cour = null;
          });
          lignes = lignes.filter(function (l) { return l.texte.trim(); });
          lignes.sort(function (a, b) { return b.y - a.y; });
          return { largeur: vue.width, lignes: lignes, page: n };
        });
      });
    }));
  }).then(function (pages) {
    // En-têtes et pieds de page répétés, numéros de page : retirés.
    var compte = {};
    pages.forEach(function (p) { [p.lignes[0], p.lignes[p.lignes.length - 1]].forEach(function (l) { if (l) { var k = l.texte.trim().replace(/\d+/g, '#'); compte[k] = (compte[k] || 0) + 1; } }); });
    var toutes = [];
    pages.forEach(function (p) {
      p.lignes.forEach(function (l, i) {
        var k = l.texte.trim().replace(/\d+/g, '#');
        if (/^(page\s*)?[\divxlc]+(\s*\/\s*\d+)?$/i.test(l.texte.trim())) return;
        if ((i === 0 || i === p.lignes.length - 1) && pages.length >= 4 && compte[k] >= Math.max(3, pages.length * 0.4)) return;
        l.page = p.page; l.largeurPage = p.largeur; toutes.push(l);
      });
    });
    var hMed = mediane(toutes.map(function (l) { return l.h; })) || 10;
    var ecarts = []; for (var i = 1; i < toutes.length; i++) if (toutes[i].page === toutes[i - 1].page) ecarts.push(toutes[i - 1].y - toutes[i].y);
    var ecart = mediane(ecarts.filter(function (e) { return e > 0; })) || hMed * 1.4;
    var gauche = mediane(toutes.map(function (l) { return l.x; })), droite = mediane(toutes.map(function (l) { return l.fin; }));
    var avecMot = toutes.some(function (l) { return MOT_CHAPITRE.test(l.texte) && l.texte.length < 100; });
    var res = [], cour = null;
    toutes.forEach(function (l, i) {
      var prec = toutes[i - 1], t = l.texte.replace(/\s+/g, ' ').trim();
      var grand = l.h >= hMed * 1.35 && t.length < 80;
      var nouveau = !prec || !cour || grand || cour.grand ||
        (prec.page === l.page && prec.y - l.y > ecart * 1.45) ||
        (l.x - gauche > hMed * 0.9 && l.x - gauche < (droite - gauche) * 0.3) ||
        (prec.fin < droite - (droite - gauche) * 0.15 && /[.!?»”:…]$/.test(prec.texte.trim()));
      if (nouveau) {
        var milieu = (l.x + l.fin) / 2, centre = Math.abs(milieu - (gauche + droite) / 2) < hMed * 2 && l.x - gauche > (droite - gauche) * 0.12;
        cour = { texte: t, centre: centre, grand: grand };
        res.push(cour);
      } else if (/[A-Za-zÀ-ÿ]-$/.test(cour.texte) && /^[a-zà-ÿ]/.test(t)) cour.texte = cour.texte.slice(0, -1) + t;
      else cour.texte += ' ' + t;
    });
    return res.map(function (p) { return para([[p.texte, 0]], { centre: p.centre, niveau: p.grand && !avecMot && p.texte.length < 80 ? 1 : null }); }).filter(Boolean);
  });
}

/* ---------- Découpe en chapitres ---------- */
var MOT_CHAPITRE = /^\s*(chapitre|chapter|chap\.|partie|prologue|[ée]pilogue|epilogue|introduction|avant-propos|acte|sc[èe]ne)\b/i;
function compterMots(t) { return (t.match(/[A-Za-zÀ-ÿ0-9]+(?:['’-][A-Za-zÀ-ÿ0-9]+)*/g) || []).length; }
function bloc(p, sousTitre) {
  if (/^[\s*#~•·—–_=-]{1,20}$/.test(p.texte) && /[*#~•·]/.test(p.texte)) return { s: 'sep' };
  var r = p.runs.map(function (x) { return x[1] ? [x[0], x[1]] : [x[0]]; });
  if (sousTitre) return { s: 'h', r: r.map(function (x) { return [x[0]]; }) };
  return { s: p.citation ? 'q' : p.centre ? 'c' : 'p', r: r };
}
// Renvoie { titre (titre du document s'il y en a un), chapitres: [{ titre, blocs, mots, avant }] }.
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
  chapitres.forEach(function (c) {
    c.mots = c.blocs.reduce(function (s, b) { return s + (b.r ? b.r.reduce(function (t, x) { return t + compterMots(x[0]); }, 0) : 0); }, 0);
    if (c.avant) c.titre = chapitres.length === 1 ? String(nomFichier || 'Chapitre 1').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_]+/g, ' ').trim() : 'Début du document';
  });
  // Un « chapitre » qui n'est qu'un titre (ex. « Partie 1 » suivi de « Chapitre 1 ») ne garde pas de page vide.
  chapitres = chapitres.filter(function (c) { return c.blocs.length || c.avant; });
  return { titre: titreDoc, chapitres: chapitres };
}

function format(nom) { var m = String(nom || '').toLowerCase().match(/\.([a-z0-9]+)$/); return m ? m[1] : ''; }
function finir(ps, nom) {
  var res = decouper(ps, nom);
  if (!res.chapitres.length) throw new Error('Ce fichier ne contient pas de texte lisible.');
  return res;
}
function accepte(nom) { return /^(docx|odt|epub|pdf|rtf|html?|txt|md|markdown)$/.test(format(nom)); }
// Paragraphes d'un fichier, quel que soit son format
function paragraphesDe(fichier) {
    var ext = format(fichier.name);
    if (ext === 'doc') return Promise.reject(new Error('« ' + fichier.name + ' » : ancien format Word (.doc). Dans Word, Fichier > Enregistrer sous > Document Word (.docx), puis importez le nouveau fichier.'));
    if (ext === 'pages') return Promise.reject(new Error('« ' + fichier.name + ' » : fichier Pages. Dans Pages, Fichier > Exporter > Word, puis importez le fichier .docx.'));
    if (!accepte(fichier.name)) return Promise.reject(new Error('« ' + fichier.name + ' » : format non reconnu. Formats acceptés : ' + FORMATS + '.'));
    return (fichier.arrayBuffer ? fichier.arrayBuffer() : new Response(fichier).arrayBuffer()).then(function (buf) {
      if (ext === 'docx') return lireDocx(lireZip(buf, 'document Word'));
      if (ext === 'odt') return lireOdt(lireZip(buf, 'document LibreOffice'));
      if (ext === 'epub') return lireEpub(lireZip(buf, 'livre EPUB'));
      if (ext === 'pdf') return lirePdf(new Uint8Array(buf));
      if (ext === 'rtf') return lireRtf(new Uint8Array(buf));
      if (ext === 'html' || ext === 'htm') return lireHtml(decoder(new Uint8Array(buf)));
      return lireTexte(decoder(new Uint8Array(buf)), ext === 'md' || ext === 'markdown');
    });
}
// Titre tiré du nom du fichier : « Chapitre 4 - Le Miroir.docx » → « Chapitre 4 - Le Miroir »
function titreFichier(nom) {
  return String(nom || '').replace(/\.[a-z0-9]{2,8}$/i, '').replace(/_\d{4,}$/, '').replace(/_+/g, ' ').replace(/\s+/g, ' ').trim() || 'Chapitre';
}
function plat(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
function numero(t) { var m = String(t).match(/chap(?:itre|ter)?\.?\s*(\d+)/i) || String(t).match(/(\d+)/); return m ? parseInt(m[1], 10) : Infinity; }
// Un fichier = un chapitre. Les titres du début (livre, partie, « Chapitre n ») sont retirés : le titre vient du nom du fichier.
function unChapitre(ps, nom) {
  var titre = titreFichier(nom), t = plat(titre), i = 0, fin = -1;
  while (i < ps.length && ps[i].niveau != null) {
    var p = plat(ps[i].texte);
    if (ps[i].niveau === 0 || MOT_CHAPITRE.test(ps[i].texte) || (p && (t.indexOf(p) >= 0 || p.indexOf(t) >= 0))) fin = i;
    i++;
  }
  var blocs = ps.slice(fin + 1).map(function (p) { return bloc(p, p.niveau != null); });
  return { titre: titre.slice(0, 160), blocs: blocs, mots: blocs.reduce(function (s, b) { return s + (b.r ? b.r.reduce(function (n, x) { return n + compterMots(x[0]); }, 0) : 0); }, 0) };
}
window.APEL_TEXTES = {
  formats: '.docx,.odt,.epub,.pdf,.rtf,.html,.htm,.txt,.md,.markdown',
  accepte: accepte,
  lire: function (fichier) { return paragraphesDe(fichier).then(function (ps) { return finir(ps, fichier.name); }); },
  // Plusieurs fichiers d'un même livre : chacun devient un chapitre, rangés selon le numéro de leur nom.
  lireChapitres: function (fichiers) {
    fichiers = [].slice.call(fichiers);
    return Promise.all(fichiers.map(function (f) { return paragraphesDe(f).then(function (ps) { return unChapitre(ps, f.name); }); })).then(function (chapitres) {
      chapitres = chapitres.map(function (c, i) { return { c: c, i: i, n: numero(c.titre) }; })
        .sort(function (a, b) { return a.n - b.n || a.c.titre.localeCompare(b.c.titre, 'fr', { numeric: true }) || a.i - b.i; })
        .map(function (x) { return x.c; }).filter(function (c) { return c.blocs.length; });
      if (!chapitres.length) throw new Error('Ces fichiers ne contiennent pas de texte lisible.');
      return { titre: '', chapitres: chapitres };
    });
  },
  // Texte collé dans l'Espace gérant (les marques Markdown # ** _ > sont comprises).
  lireColle: function (texte, nom) { return finir(lireTexte(texte, true), nom || 'Texte collé'); },
  decouper: decouper
};
// Ancien nom, gardé pour les pages déjà ouvertes
window.APEL_WORD = window.APEL_TEXTES;
})();
