/* Shopping R-Lux : vitrine, panier (commande WhatsApp avec la ville du client) et espace gérant.
   Le catalogue publié est lu dans donnees/produits.json ; l'espace gérant l'écrit par /api/gerant. */
"use strict";
var API = "/api/gerant";
var WA1 = "237676962519", WA2 = "237690808155", MAIL = "shoppingrlux12@gmail.com";
// Communauté WhatsApp de la boutique (modifiable dans l'espace gérant, « Coordonnées »)
var GROUPE = "https://chat.whatsapp.com/GFLtFN347yZFBPRGVMrK9G", CHAINE = "https://whatsapp.com/channel/0029VbEJaFuEgGfFLPiy1z2l";

/* Univers de la boutique et leurs catégories (les produits qui se ressemblent sont regroupés) */
var RAYONS = {
  parfums: { nom: "Parfumerie", cats: ["Parfums", "Brumes", "Déodorants", "Huiles de parfum", "Parfums de maison"], ico: "ico-parfum", choix: "Choisissez la contenance", exemple: "30 ml, 50 ml, 100 ml" },
  soins: { nom: "Soins du corps", cats: ["Laits de toilette", "Savons de toilette", "Gommages corporels", "Huiles", "Savons"], ico: "ico-soin", choix: "Choisissez le format", exemple: "250 ml, 500 ml" },
  lingerie: { nom: "Lingerie et sous-vêtements", court: "Lingerie", cats: ["Sous-vêtements femmes", "Sous-vêtements hommes", "Sous-vêtements enfants", "Nuisettes et bikinis"], ico: "ico-cintre", choix: "Choisissez la taille", exemple: "S, M, L, XL" },
  accessoires: { nom: "Sacs et accessoires", court: "Sacs et accessoires", cats: ["Sacs et accessoires", "Gadgets du quotidien", "Autres"], ico: "ico-sac", choix: "Choisissez", exemple: "Noir, Rouge, Beige" },
  livres: { nom: "Livres de Robyn Tyo’o", court: "Livres", cats: ["Romans", "Autres livres"], ico: "ico-livre", choix: "Choisissez", exemple: "" }
};
var ICONES = {
  parfums: "M9.5 2.5h5v3.5h-5zM10.5 6v2.2M13.5 6v2.2M8 8.2h8a2.5 2.5 0 0 1 2.5 2.5v8.3a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 19v-8.3A2.5 2.5 0 0 1 8 8.2ZM8.5 12.5c1 1.5 2.2 2.2 3.5 2.2s2.5-.7 3.5-2.2M16.5 3.5l2-1M16.8 5h2.4",
  soins: "M9 2.5h4l2.5 1.5M11 2.5v3M8.5 5.5h5V8M8 8h6a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2ZM8.5 13h5M19 13.5c1.2 1.6 1.8 2.7 1.8 3.5a1.8 1.8 0 0 1-3.6 0c0-.8.6-1.9 1.8-3.5Z",
  lingerie: "M10 6.2a2 2 0 1 1 2.6 1.9c-.4.1-.6.5-.6.9v1L3.3 15.6a1 1 0 0 0 .6 1.9h16.2a1 1 0 0 0 .6-1.9L12 10",
  accessoires: "M4.5 10h15l-1.3 9.3a2 2 0 0 1-2 1.7H7.8a2 2 0 0 1-2-1.7L4.5 10ZM8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M10.5 13.5h3v2h-3z",
  livres: "M12 6.5C10 5 7.5 4.5 3.5 4.5v13c4 0 6.5.5 8.5 2 2-1.5 4.5-2 8.5-2v-13c-4 0-6.5.5-8.5 2Zm0 0v13"
};
// Villes proposées au client (Douala en premier : c'est là qu'est la boutique)
var VILLES = ["Douala"].concat(["Yaoundé", "Bafoussam", "Bamenda", "Bertoua", "Buea", "Dschang", "Ebolowa", "Edéa", "Foumban", "Garoua", "Kribi", "Kumba", "Limbe", "Maroua", "Mbalmayo", "Mbouda", "Ngaoundéré", "Nkongsamba", "Sangmélima", "Bafang", "Bangangté", "Tiko", "Loum", "Mbanga", "Kousseri", "Meiganga", "Batouri", "Yagoua", "Obala", "Bafia", "Foumbot", "Wum", "Kumbo", "Mamfe", "Garoua-Boulaï", "Guider", "Mokolo", "Abong-Mbang", "Ambam", "Akonolinga"].sort(function (a, b) { return a.localeCompare(b, "fr"); }));

/* Petits outils */
function $(id) { return document.getElementById(id); }
function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function fcfa(n) { return Math.round(n).toLocaleString("fr-FR").replace(/[\s  ]/g, " ") + " FCFA"; }
function chiffres(n) { return String(n || "").replace(/\D/g, ""); }
function lire(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null || typeof v !== typeof d || Array.isArray(v) !== Array.isArray(d) ? d : v; } catch (e) { return d; } }
function ecrire(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function vibrer() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} }
function pluriel(n, mot) { return n + " " + mot + (n > 1 ? "s" : ""); }
function numeroLisible(n) { var d = chiffres(n); if (d.length === 12 && d.indexOf("237") === 0) return "+237 " + d.slice(3, 6) + " " + d.slice(6, 9) + " " + d.slice(9); return d ? "+" + d : ""; }
function lienWa(texte, numero) { return "https://wa.me/" + (chiffres(numero) || chiffres(etat.config.whatsapp) || WA1) + "?text=" + encodeURIComponent(texte); }
function nomRayon(k, court) { var r = RAYONS[k]; return r ? (court && r.court || r.nom) : ""; }

/* Illustrations dorées pour les articles sans photo */
var DESSINS = {};
function dessin(r) {
  var k = ICONES[r] ? r : "parfums";
  if (DESSINS[k]) return DESSINS[k];
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><radialGradient id="f" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#2A2217"/><stop offset="1" stop-color="#0B0908"/></radialGradient>' +
    '<linearGradient id="o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".5" stop-color="#D9AE4E"/><stop offset="1" stop-color="#9C6F12"/></linearGradient></defs>' +
    '<rect width="400" height="500" fill="url(#f)"/><g transform="translate(110 150) scale(7.5)" fill="none" stroke="url(#o)" stroke-width="1.05" stroke-linejoin="round" stroke-linecap="round"><path d="' + ICONES[k] + '"/></g></svg>';
  return (DESSINS[k] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
}

/* Données : catalogue publié, puis copie de travail dans l'espace gérant */
function nouvelId() { return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function P(o) { return Object.assign({ id: nouvelId(), nom: "", rayon: "parfums", categorie: "Parfums", marque: "", details: "", options: "", auteur: "", lien: "", prix: 0, prixPromo: 0, nouveau: false, vedette: false, stock: "ok", visible: true, photos: [] }, o); }
function configVide() { return { whatsapp: WA1, whatsapp2: WA2, email: MAIL, facebook: "", tiktok: "", groupe: GROUPE, chaine: CHAINE, annonce: "" }; }
function completer(d) {
  d = d && typeof d === "object" ? d : {};
  var c = Object.assign(configVide(), d.config || {});
  var produits = (Array.isArray(d.produits) ? d.produits : []).map(P).map(function (p) { if (!RAYONS[p.rayon]) p.rayon = "parfums"; if (!Array.isArray(p.photos)) p.photos = []; return p; });
  return { config: c, produits: produits };
}
var etat = completer(null), publie = JSON.stringify(etat), version = null, charge = false;
var nouvellesPhotos = {}; // photos prises dans l'espace gérant, pas encore enregistrées
var gerant = null, comptes = [], proprio = "";
try { gerant = JSON.parse(sessionStorage.getItem("rlux-gerant")); if (gerant && !(gerant.expire > Date.now() / 1000)) gerant = null; } catch (e) { gerant = null; }

function trouver(id) { return etat.produits.find(function (p) { return p.id === id; }); }
function visibles() { return etat.produits.filter(function (p) { return p.visible && p.nom; }); }
function photo(p, i) { var k = p.photos[i || 0]; if (!k) return dessin(p.rayon); return nouvellesPhotos[k] || k; }
function enPromo(p) { return p.prixPromo > 0 && p.prixPromo < p.prix; }
function prixFinal(p) { return enPromo(p) ? p.prixPromo : p.prix; }
function remise(p) { return Math.round((1 - p.prixPromo / p.prix) * 100); }
function prixTexte(p) { return p.prix ? fcfa(prixFinal(p)) : "Prix sur demande"; }
function listeOptions(p) { var vus = {}; return String(p.options || "").split(/[,;\n]/).map(function (x) { return x.trim(); }).filter(function (x) { if (!x || vus[x.toLowerCase()]) return false; vus[x.toLowerCase()] = 1; return true; }).slice(0, 24); }

/* Ce que le client garde sur son téléphone : panier, favoris, demandes de rappel, adresse */
var panier = lire("rlux-panier", []).filter(function (l) { return l && typeof l.id === "string"; }).map(function (l) { return { id: l.id, o: String(l.o || ""), q: Math.min(20, Math.max(1, parseInt(l.q, 10) || 1)) }; });
var favoris = lire("rlux-favoris", []).filter(function (x) { return typeof x === "string"; });
var alertes = lire("rlux-alertes", {});
var client = Object.assign({ ville: "", autre: "", quartier: "", nom: "", num: 0 }, lire("rlux-client", {}));

/* Chargement du catalogue publié */
function chargerBoutique() {
  return fetch("donnees/produits.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (gerant && modifie()) return; // ne pas écraser le travail en cours du gérant
      etat = completer(d); publie = JSON.stringify(etat); charge = true;
      panier = panier.filter(function (l) { return trouver(l.id); }); sauverPanier();
      rendreTout(); verifierRetours(); lienDirect();
    })
    .catch(function () { charge = true; rendreTout(); if (!etat.produits.length) montrer("Catalogue indisponible : vérifiez la connexion internet."); });
}

/* Recherche : sans accents, avec synonymes et budget (« 10000 », « 10k », « moins de 15 000 ») */
function plat(s) { return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " "); }
var SYN = [["parfum", "parfums", "fragrance", "edp", "edt", "eau de parfum", "eau de toilette", "senteur", "senteurs"], ["brume", "brumes", "mist", "body mist"], ["deodorant", "deodorants", "deo", "anti transpirant", "antitranspirant"],
  ["huile", "huiles", "oil"], ["savon", "savons", "soap"], ["lait", "laits", "lotion", "creme", "body lotion"], ["gommage", "gommages", "scrub", "exfoliant"], ["maison", "diffuseur", "bougie", "desodorisant", "ambiance"],
  ["sac", "sacs", "sacoche", "pochette", "bag", "sac a main", "portefeuille"], ["slip", "slips", "culotte", "culottes", "string", "boxer", "boxers", "calecon", "sous vetement", "sous vetements", "lingerie", "soutien gorge", "soutif", "bra"],
  ["nuisette", "nuisettes", "pyjama", "bikini", "bikinis", "maillot"], ["enfant", "enfants", "bebe", "fille", "garcon", "kids"], ["homme", "hommes", "men", "monsieur"], ["femme", "femmes", "dame", "dames", "women", "madame"],
  ["livre", "livres", "roman", "romans", "book", "lecture"], ["gadget", "gadgets", "accessoire", "accessoires"]];
var VIDES = /\b(moins|de|du|des|max|maximum|budget|jusqu|a|au|aux|pour|le|la|les|un|une|et|en|mon|ma|mes|cherche|je)\b/g;
function analyser(q) {
  var t = " " + plat(q) + " ", budget = 0;
  // Expressions de plusieurs mots (« eau de toilette », « sac a main ») ramenées au mot principal du groupe
  SYN.forEach(function (g) { g.forEach(function (x) { if (x.indexOf(" ") > 0 && t.indexOf(" " + x + " ") >= 0) t = t.split(" " + x + " ").join(" " + g[0] + " "); }); });
  t = t.replace(/(\d+(?:[ .]\d{3})*)(?!\d)\s*(k|mille)?(?!\s*(?:ml|cl|g|kg|l)\b)\s*(f|fcfa|frs?|francs?|xaf)?\b/g, function (m, n, k) {
    var v = parseInt(n.replace(/[ .]/g, ""), 10) * (k ? 1000 : 1); if (v >= 500) { budget = v; return " "; } return m; });
  return { mots: t.replace(VIDES, " ").split(/[^a-z0-9]+/).filter(function (m) { return m.length > 1; }), budget: budget };
}
function texteProduit(p) { return " " + plat([p.nom, p.marque, p.categorie, nomRayon(p.rayon), p.details, p.options, p.auteur, enPromo(p) ? "promo promotion" : "", p.nouveau ? "nouveau nouveaute" : ""].join(" ")) + " "; }
function variantes(m) {
  var l = [m]; if (m.length > 3 && /[sx]$/.test(m)) l.push(m.slice(0, -1));
  SYN.forEach(function (g) { if (g.indexOf(m) >= 0 || l.some(function (x) { return g.indexOf(x) >= 0; })) l = l.concat(g); });
  return l;
}
function correspond(p, a) {
  if (a.budget && !(p.prix > 0 && prixFinal(p) <= a.budget)) return false;
  var txt = texteProduit(p);
  return a.mots.every(function (m) { return variantes(m).some(function (v) { return txt.indexOf(v.length < 4 ? " " + v : v) >= 0; }); });
}

/* Boutique : univers, filtres, cartes */
var rayon = "tous", cat = "tous", requete = "", tri = "reco", voirFavoris = false;
function rendreTout() { rendreCoordonnees(); rendreAnnonce(); rendreUnivers(); rendreUne(); rendreEtagere(); rendreBoutique(); majBadge(); }
function rendreAnnonce() { var a = $("annonce"), t = etat.config.annonce; a.hidden = !t; a.textContent = t || ""; }
function rendreUnivers() {
  var v = visibles();
  $("univers").innerHTML = Object.keys(RAYONS).map(function (k) {
    var n = v.filter(function (p) { return p.rayon === k; }).length, r = RAYONS[k];
    return '<button class="univ verre vivant" type="button" data-voir-rayon="' + k + '" aria-pressed="' + (rayon === k) + '"><span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#' + r.ico + '"/></svg></span><span><b>' + esc(r.court || r.nom) + "</b><small>" + esc(r.cats.join(" · ")) + "</small><em>" + (n ? pluriel(n, "article") : "Bientôt") + "</em></span></button>";
  }).join("");
}
function rendreUne() {
  var l = visibles().filter(function (p) { return p.vedette; }).slice(0, 12);
  $("une-zone").hidden = !l.length; $("une").innerHTML = l.map(mini).join("");
}
function rendreEtagere() {
  var l = visibles().filter(function (p) { return p.rayon === "livres"; });
  $("livres").hidden = !l.length;
  document.querySelector('[data-onglet="livres"]').hidden = !l.length;
  $("etagere").innerHTML = l.slice(0, 4).map(function (p) {
    return '<button class="livre3d" type="button" data-fiche="' + esc(p.id) + '" aria-label="' + esc(p.nom) + '"><span class="objet"><img src="' + esc(photo(p)) + '" alt="" loading="lazy"><span class="reflet"></span></span><span class="titre"><b>' + esc(p.nom) + "</b>" + esc(prixTexte(p)) + "</span></button>";
  }).join("");
}
function compte(k) { return visibles().filter(function (p) { return k === "tous" || p.rayon === k; }).length; }
function rendrePuces() {
  $("puces-rayons").innerHTML = [["tous", "Tout", "ico-tout"]].concat(Object.keys(RAYONS).map(function (k) { return [k, RAYONS[k].court || RAYONS[k].nom, RAYONS[k].ico]; })).map(function (x) {
    return '<button class="puce" type="button" data-rayon="' + x[0] + '" aria-pressed="' + (!voirFavoris && rayon === x[0]) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#' + x[2] + '"/></svg>' + esc(x[1]) + " <small>" + compte(x[0]) + "</small></button>";
  }).join("");
  $("nb-favoris").textContent = favorisVisibles().length || "";
  var pc = $("puces-cats");
  if (rayon === "tous" || voirFavoris) { pc.hidden = true; return; }
  var dans = visibles().filter(function (p) { return p.rayon === rayon; }), cats = RAYONS[rayon].cats.slice();
  dans.forEach(function (p) { if (p.categorie && cats.indexOf(p.categorie) < 0) cats.push(p.categorie); });
  cats = cats.filter(function (c) { return dans.some(function (p) { return p.categorie === c; }); });
  pc.hidden = cats.length < 2;
  pc.innerHTML = '<button class="puce" type="button" data-cat="tous" aria-pressed="' + (cat === "tous") + '">Tout</button>' + cats.map(function (c) {
    var n = dans.filter(function (p) { return p.categorie === c; }).length;
    return '<button class="puce" type="button" data-cat="' + esc(c) + '" aria-pressed="' + (cat === c) + '">' + esc(c) + " <small>" + n + "</small></button>";
  }).join("");
}
function favorisVisibles() { return favoris.filter(function (id) { var p = trouver(id); return p && p.visible; }); }
function filtres() {
  var a = analyser(requete);
  var l = visibles().filter(function (p) {
    if (voirFavoris) return favoris.indexOf(p.id) >= 0 && correspond(p, a);
    if (rayon !== "tous" && p.rayon !== rayon) return false;
    if (cat !== "tous" && p.categorie !== cat) return false;
    return correspond(p, a);
  });
  return { liste: trier(l), budget: a.budget };
}
function trier(l) {
  var ordre = {}; etat.produits.forEach(function (p, i) { ordre[p.id] = i; });
  var dispo = function (p) { return p.stock === "epuise" ? 1 : 0; };
  var f = {
    reco: function (a, b) { return dispo(a) - dispo(b) || (b.vedette - a.vedette) || (b.nouveau - a.nouveau) || ordre[a.id] - ordre[b.id]; },
    "prix-asc": function (a, b) { return (a.prix ? prixFinal(a) : 1e12) - (b.prix ? prixFinal(b) : 1e12); },
    "prix-desc": function (a, b) { return prixFinal(b) - prixFinal(a); },
    nouveau: function (a, b) { return (b.nouveau - a.nouveau) || ordre[a.id] - ordre[b.id]; },
    promo: function (a, b) { return (enPromo(b) ? remise(b) : -1) - (enPromo(a) ? remise(a) : -1) || ordre[a.id] - ordre[b.id]; }
  }[tri] || function () { return 0; };
  return l.slice().sort(f);
}
function badge(p) {
  if (p.stock === "epuise") return '<span class="badge epuise">Épuisé</span>';
  if (enPromo(p)) return '<span class="badge promo">-' + remise(p) + " %</span>";
  return p.nouveau ? '<span class="badge">Nouveau</span>' : "";
}
function blocPrix(p) { var r = enPromo(p); return '<div class="prix">' + (r ? "<s>" + fcfa(p.prix) + "</s>" : "") + (p.prix ? '<b class="' + (r ? "reduit" : "") + '">' + fcfa(prixFinal(p)) + "</b>" : '<b class="demande">Prix sur demande</b>') + "</div>"; }
function ligneStock(p) { return p.stock === "peu" ? '<span class="stock peu">Dernières pièces</span>' : p.stock === "epuise" ? '<span class="stock epuise">Épuisé pour le moment</span>' : ""; }
function coeur(p) { var oui = favoris.indexOf(p.id) >= 0; return '<button class="coeur" type="button" data-favori="' + esc(p.id) + '" aria-pressed="' + oui + '" aria-label="' + (oui ? "Retirer des favoris" : "Ajouter aux favoris") + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-coeur"/></svg></button>'; }
function dansPanier(id) { return panier.some(function (l) { return l.id === id; }); }
function boutonAction(p) {
  if (p.stock === "epuise") return '<button class="bouton" type="button" data-prevenir="' + esc(p.id) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-cloche"/></svg>' + (alertes[p.id] ? "Demandé" : "Me prévenir") + "</button>";
  if (dansPanier(p.id)) return '<button class="bouton ajoute" type="button" data-voir-panier>✓ Dans le panier</button>';
  if (listeOptions(p).length) return '<button class="bouton or" type="button" data-fiche="' + esc(p.id) + '">Choisir</button>';
  return '<button class="bouton or" type="button" data-ajouter="' + esc(p.id) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-panier"/></svg>Ajouter</button>';
}
function carte(p) {
  var livre = p.rayon === "livres";
  return '<article class="produit verre vivant' + (livre ? " livre" : "") + '" data-id="' + esc(p.id) + '"><div class="photo"><button class="ouvrir" type="button" data-fiche="' + esc(p.id) + '" aria-label="Voir ' + esc(p.nom) + '"><img src="' + esc(photo(p)) + '" alt="" loading="lazy" decoding="async"></button>' + badge(p) + coeur(p) + "</div>" +
    '<div class="infos"><span class="cat">' + esc(p.categorie || nomRayon(p.rayon, true)) + '</span><h3><button type="button" data-fiche="' + esc(p.id) + '">' + esc(p.nom) + "</button></h3>" + (livre && p.auteur ? '<span class="auteur">' + esc(p.auteur) + "</span>" : "") + blocPrix(p) + ligneStock(p) + boutonAction(p) + "</div></article>";
}
function mini(p) { return '<button class="mini' + (p.rayon === "livres" ? " livre" : "") + '" type="button" data-fiche="' + esc(p.id) + '"><img src="' + esc(photo(p)) + '" alt="" loading="lazy"><b>' + esc(p.nom) + "</b><span" + (enPromo(p) ? ' class="reduit"' : "") + ">" + esc(prixTexte(p)) + "</span></button>"; }
function rendreBoutique() {
  rendrePuces();
  var r = filtres(), l = r.liste, g = $("grille");
  $("titre-boutique").textContent = voirFavoris ? "Mes favoris" : requete.trim() ? "Résultats" : rayon === "tous" ? "La boutique" : nomRayon(rayon);
  $("compte-produits").textContent = charge ? pluriel(l.length, "article") : "";
  $("voir-favoris").setAttribute("aria-pressed", voirFavoris);
  var b = $("budget"); b.hidden = !r.budget; b.textContent = r.budget ? "Budget : jusqu'à " + fcfa(r.budget) : "";
  $("effacer-recherche").hidden = !requete;
  if (!charge) { g.innerHTML = '<div class="vide verre"><p>Chargement de la boutique…</p></div>'; return; }
  if (l.length) { g.innerHTML = l.map(carte).join(""); return; }
  var q = requete.trim(), msg;
  if (voirFavoris) msg = "<p>Touchez le cœur d'un article pour le retrouver ici.</p>";
  else if (q) msg = "<p>Aucun article ne correspond à « " + esc(q) + " ».</p>" + '<a class="bouton wa" target="_blank" rel="noopener" href="' + esc(lienWa("Bonjour Shopping R-Lux, je cherche : " + q + ". L'avez-vous ?")) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-wa"/></svg>Demander sur WhatsApp</a>';
  else msg = "<p>Les articles de cet univers arrivent bientôt. Dites-nous ce que vous cherchez" + (etat.config.chaine ? ", ou suivez la chaîne pour être prévenu des arrivages" : "") + " :</p>" + '<div class="boutons"><a class="bouton wa" target="_blank" rel="noopener" href="' + esc(lienWa("Bonjour Shopping R-Lux, je cherche un article " + (rayon === "tous" ? "" : "(" + nomRayon(rayon) + ") ") + ": ")) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-wa"/></svg>Demander sur WhatsApp</a>' +
    (etat.config.chaine ? '<a class="bouton" target="_blank" rel="noopener" href="' + esc(etat.config.chaine) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-chaine"/></svg>Suivre la chaîne</a>' : "") + "</div>";
  g.innerHTML = '<div class="vide verre"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + (rayon !== "tous" && !voirFavoris ? RAYONS[rayon].ico : "ico-loupe") + '"/></svg>' + msg + "</div>";
}
function choisirRayon(k, defiler) {
  rayon = RAYONS[k] ? k : "tous"; cat = "tous"; voirFavoris = false;
  rendreBoutique(); rendreUnivers();
  if (defiler) $("boutique").scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "start" });
}

/* Coordonnées affichées partout (modifiables dans l'espace gérant) */
function numeros() { var c = etat.config, l = []; [c.whatsapp, c.whatsapp2].forEach(function (n) { n = chiffres(n); if (n && l.indexOf(n) < 0) l.push(n); }); return l.length ? l : [WA1]; }
function rendreCoordonnees() {
  var c = etat.config, n1 = chiffres(c.whatsapp), n2 = chiffres(c.whatsapp2), salut = "Bonjour Shopping R-Lux, ";
  $("wa-entete").href = lienWa(salut);
  $("canal-wa1").hidden = !n1; $("wa1-numero").textContent = numeroLisible(n1); $("wa1-lien").href = lienWa(salut, n1);
  $("canal-wa2").hidden = !n2; $("wa2-numero").textContent = numeroLisible(n2); $("wa2-lien").href = lienWa(salut, n2); $("wa2-appel").href = "tel:+" + n2;
  var m = c.email || MAIL; $("mail-adresse").textContent = m; $("mail-lien").href = "mailto:" + m + "?subject=" + encodeURIComponent("Commande Shopping R-Lux");
  $("lien-fb").href = c.facebook || "https://www.facebook.com/search/top?q=" + encodeURIComponent("Shopping R-Lux");
  $("lien-tt").href = c.tiktok || "https://www.tiktok.com/search?q=" + encodeURIComponent("Shopping R-Lux");
  // Groupe et chaîne WhatsApp : un lien vide masque son bouton, deux liens vides masquent la section
  [["groupe", "lien-groupe", "pied-groupe"], ["chaine", "lien-chaine", "pied-chaine"]].forEach(function (x) {
    var u = c[x[0]] || ""; [x[1], x[2]].forEach(function (id) { var a = $(id); a.hidden = !u; a.href = u || "#"; });
  });
  $("communaute").hidden = !c.groupe && !c.chaine; $("pied-communaute").hidden = !c.groupe && !c.chaine;
  $("pied-sep").hidden = !c.groupe || !c.chaine;
}

/* Feuilles de verre : fiche produit, panier, demande de rappel */
var voile = $("voile"), feuille = null, avantFeuille = null, historiqueFeuille = false;
function coque(titre, html) {
  return '<div class="fiche verre" role="dialog" aria-modal="true" aria-label="' + esc(titre) + '"><span class="poignee" aria-hidden="true"></span><div class="feuille-titre"><h3>' + esc(titre) + '</h3><button class="fermer" type="button" aria-label="Fermer" data-fermer>×</button></div>' + html + "</div>";
}
function afficher(html, quoi, garderPlace) {
  var f = voile.querySelector(".fiche"), haut = garderPlace && f && feuille === quoi ? f.scrollTop : 0, nouvelle = voile.hidden;
  if (nouvelle) { avantFeuille = document.activeElement; $("toast").hidden = true; }
  voile.innerHTML = html; voile.hidden = false; feuille = quoi; document.documentElement.style.overflow = "hidden";
  // Feuille déjà ouverte (quantité changée, autre article) : le contenu change sur place, sans rejouer l'animation
  f = voile.querySelector(".fiche"); if (!nouvelle) f.style.animation = "none"; if (haut) f.scrollTop = haut;
  if (nouvelle) { var x = voile.querySelector("[data-fermer]"); if (x) x.focus({ preventScroll: true }); if (!historiqueFeuille) { try { history.pushState({ feuille: 1 }, ""); historiqueFeuille = true; } catch (e) {} } }
  ongletActif();
}
function fermer(depuisHistorique) {
  if (voile.hidden) return;
  voile.hidden = true; voile.innerHTML = ""; feuille = null; document.documentElement.style.overflow = "";
  if (historiqueFeuille) { historiqueFeuille = false; if (!depuisHistorique) try { history.back(); } catch (e) {} }
  if (avantFeuille && avantFeuille.focus && document.contains(avantFeuille)) avantFeuille.focus({ preventScroll: true });
  ongletActif();
}
window.addEventListener("popstate", function () { if (!voile.hidden) { historiqueFeuille = false; fermer(true); } });
voile.addEventListener("click", function (e) { if (e.target === voile) fermer(); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !voile.hidden) fermer(); });
// Glisser la feuille vers le bas pour la fermer (téléphone)
(function () {
  var y0 = null, dy = 0, f = null;
  voile.addEventListener("touchstart", function (e) { f = voile.querySelector(".fiche"); if (!f || f.scrollTop > 0 || e.target.closest(".rail,.defile,input,select,textarea")) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
  voile.addEventListener("touchmove", function (e) { if (y0 == null || !f) return; dy = Math.max(0, e.touches[0].clientY - y0); if (dy > 4) { f.style.transition = "none"; f.style.transform = "translateY(" + dy + "px)"; } }, { passive: true });
  voile.addEventListener("touchend", function () { if (y0 == null || !f) return; y0 = null; f.style.transition = "transform .3s cubic-bezier(.2,.8,.2,1)"; if (dy > 110) fermer(); else f.style.transform = ""; });
})();

var choixFiche = "", qteFiche = 1;
function similaires(p) {
  var v = visibles().filter(function (x) { return x.id !== p.id && x.stock !== "epuise"; });
  var proches = v.filter(function (x) { return x.categorie === p.categorie; }).concat(v.filter(function (x) { return x.rayon === p.rayon && x.categorie !== p.categorie; }));
  return proches.slice(0, 8);
}
function ouvrirFiche(id) {
  var p = trouver(id); if (!p || !p.visible) return;
  var livre = p.rayon === "livres", n = Math.max(1, p.photos.length), ep = p.stock === "epuise", opts = listeOptions(p), sim = similaires(p);
  choixFiche = opts.length === 1 ? opts[0] : ""; qteFiche = 1;
  var imgs = ""; for (var i = 0; i < n; i++) imgs += '<img src="' + esc(photo(p, i)) + '" alt="' + esc(p.nom) + (n > 1 ? ", photo " + (i + 1) : "") + '"' + (i ? ' loading="lazy"' : "") + ">";
  var question = "Bonjour Shopping R-Lux, j'ai une question sur cet article : " + p.nom + (p.prix ? " (" + fcfa(prixFinal(p)) + ")" : "") + ". ";
  var html = '<div class="galerie' + (livre ? " livre" : "") + '"><div class="rail" id="rail">' + imgs + "</div></div>" +
    (n > 1 ? '<div class="points" id="points">' + Array.apply(null, Array(n)).map(function (x, j) { return "<i" + (j ? "" : ' class="actif"') + "></i>"; }).join("") + "</div>" : "") +
    '<p class="cat">' + esc((p.categorie ? p.categorie + " · " : "") + nomRayon(p.rayon, true)) + "</p><h2>" + esc(p.nom) + "</h2>" +
    (p.auteur && livre ? '<p class="auteur">de <b>' + esc(p.auteur) + "</b></p>" : p.marque ? '<p class="auteur">' + esc(p.marque) + "</p>" : "") +
    blocPrix(p).replace("</div>", enPromo(p) ? '<span class="remise">-' + remise(p) + " %</span></div>" : "</div>") + ligneStock(p) +
    (p.details ? '<p class="desc">' + esc(p.details) + "</p>" : "") +
    (opts.length && !ep ? "<h4>" + esc(RAYONS[p.rayon].choix) + '</h4><div class="choix" id="choix" role="group">' + opts.map(function (o) { return '<button type="button" data-choix="' + esc(o) + '" aria-pressed="' + (o === choixFiche) + '">' + esc(o) + "</button>"; }).join("") + '</div><p class="msg-erreur" id="erreur-choix" hidden></p>' : "") +
    (ep ? '<div class="rangee"><button class="bouton or" type="button" data-prevenir="' + esc(p.id) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-cloche"/></svg>' + (alertes[p.id] ? "Demande envoyée" : "Me prévenir quand il revient") + "</button></div>"
      : '<div class="rangee"><div class="quantite" aria-label="Quantité"><button type="button" data-fq="-1" aria-label="Moins">−</button><output id="fq">1</output><button type="button" data-fq="1" aria-label="Plus">+</button></div>' +
        '<button class="bouton or" type="button" id="ajouter-fiche" data-ajouter-fiche="' + esc(p.id) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-panier"/></svg>Ajouter au panier</button></div>') +
    '<div class="petits"><a class="bouton wa" target="_blank" rel="noopener" href="' + esc(lienWa(question)) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-wa"/></svg>Une question ?</a>' +
    '<button class="bouton" type="button" data-partager="' + esc(p.id) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-partager"/></svg>Partager</button>' + coeur(p) + "</div>" +
    (p.lien ? '<a class="bouton large" style="margin-top:10px" target="_blank" rel="noopener" href="' + esc(p.lien) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-livre"/></svg>Lire la version numérique</a>' : "") +
    (sim.length ? '<h4>Vous aimerez aussi</h4><div class="defile">' + sim.map(mini).join("") + "</div>" : "");
  afficher(coque(nomRayon(p.rayon, true), html), "fiche");
  var rail = $("rail"), pts = $("points");
  if (rail && pts) rail.addEventListener("scroll", function () { var k = Math.round(rail.scrollLeft / rail.clientWidth); Array.prototype.forEach.call(pts.children, function (x, j) { x.classList.toggle("actif", j === k); }); }, { passive: true });
}

/* Panier : un seul message WhatsApp pour toute la commande, avec la ville de livraison */
function sauverPanier() { ecrire("rlux-panier", panier); majBadge(); }
function nbArticles() { return panier.reduce(function (s, l) { return s + l.q; }, 0); }
function majBadge(secouer) {
  var n = nbArticles();
  ["nb-panier", "nb-panier-2"].forEach(function (id) { var b = $(id); b.hidden = !n; b.textContent = n > 99 ? "99+" : n; });
  if (secouer) ["ouvrir-panier", "onglet-panier"].forEach(function (id) { var b = $(id); b.classList.remove("secoue"); void b.offsetWidth; b.classList.add("secoue"); });
}
function voler(depuis) {
  if (calme || !depuis) return;
  var cible = $("onglet-panier"), zone = depuis.closest(".produit,.fiche"), img = zone && zone.querySelector("img"), a = (img || depuis).getBoundingClientRect(), c = cible.getBoundingClientRect();
  var d = document.createElement("i"); d.className = "vole"; d.style.left = a.left + a.width / 2 - 9 + "px"; d.style.top = a.top + a.height / 2 - 9 + "px"; document.body.appendChild(d);
  var dx = c.left + c.width / 2 - (a.left + a.width / 2), dy = c.top + c.height / 2 - (a.top + a.height / 2);
  if (d.animate) d.animate([{ transform: "translate(0,0) scale(1.4)", opacity: 1 }, { transform: "translate(" + dx * .5 + "px," + (dy * .5 - 90) + "px) scale(1)", opacity: 1, offset: .5 }, { transform: "translate(" + dx + "px," + dy + "px) scale(.4)", opacity: .2 }], { duration: 700, easing: "cubic-bezier(.45,0,.2,1)" }).onfinish = function () { d.remove(); };
  else d.remove();
}
function ajouterPanier(id, o, q, depuis) {
  var p = trouver(id); if (!p || p.stock === "epuise") return;
  var l = panier.find(function (x) { return x.id === id && x.o === (o || ""); });
  if (l) l.q = Math.min(20, l.q + q); else panier.push({ id: id, o: o || "", q: Math.min(20, q) });
  sauverPanier(); vibrer(); voler(depuis); setTimeout(function () { majBadge(true); }, calme ? 0 : 600);
  majBoutons();
  if (feuille !== "fiche") montrer("Ajouté au panier · Voir le panier", ouvrirPanier); // dans la fiche, le bouton le dit déjà
}
function majBoutons() { if (!voile.hidden && feuille === "panier") return; rendreBoutique(); }
function lignesPanier() { return panier.map(function (l) { return { l: l, p: trouver(l.id) }; }).filter(function (x) { return x.p; }); }
function villeClient() { return client.ville === "autre" ? client.autre.trim() : client.ville; }
function modeLivraison() { var v = villeClient(); return !v ? "" : plat(v) === "douala" ? "Livraison à Douala" : "Expédition vers " + v; }
function messagePanier() {
  var tot = 0, aConfirmer = false, lignes = lignesPanier().filter(function (x) { return x.p.stock !== "epuise"; }).map(function (x) {
    var p = x.p, q = x.l.q; if (p.prix) tot += prixFinal(p) * q; else aConfirmer = true;
    return "• " + q + " × " + p.nom + (x.l.o ? " (" + x.l.o + ")" : "") + " : " + (p.prix ? fcfa(prixFinal(p) * q) : "prix à confirmer");
  });
  var v = villeClient();
  return "Bonjour Shopping R-Lux, je souhaite commander :\n\n" + lignes.join("\n") + "\n\n" +
    (tot ? "Total des articles : " + fcfa(tot) + (aConfirmer ? " (+ articles à prix à confirmer)" : "") + "\n" : "") +
    "Ville : " + (v ? v + (plat(v) === "douala" ? " (livraison)" : " (expédition)") : "à préciser") + "\n" +
    (client.quartier.trim() ? "Quartier : " + client.quartier.trim() + "\n" : "") +
    (client.nom.trim() ? "Nom : " + client.nom.trim() + "\n" : "") +
    "\nMerci de me confirmer la disponibilité" + (v && plat(v) !== "douala" ? ", les frais d'expédition" : ", les frais de livraison") + " et le mode de paiement.";
}
function ouvrirPanier(garderPlace) {
  var l = lignesPanier(), titre = "Mon panier";
  if (!l.length) {
    afficher(coque(titre, '<div class="vide-panier"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-panier"/></svg><p>Votre panier est vide.</p><button class="bouton or" type="button" data-aller="boutique">Découvrir la boutique</button></div>'), "panier");
    return;
  }
  var tot = 0, aConfirmer = false, dispo = 0;
  var lignes = l.map(function (x) {
    var p = x.p, ind = p.stock === "epuise", k = panier.indexOf(x.l);
    if (!ind) { dispo++; if (p.prix) tot += prixFinal(p) * x.l.q; else aConfirmer = true; }
    return '<div class="ligne-panier' + (ind ? " indispo" : "") + (p.rayon === "livres" ? " livre" : "") + '"><img src="' + esc(photo(p)) + '" alt=""><div><b>' + esc(p.nom) + "</b>" + (x.l.o ? "<small>" + esc(x.l.o) + "</small>" : "") +
      (ind ? '<small style="color:var(--attention)">Épuisé : retiré de la commande</small>' : '<span class="pu">' + (p.prix ? fcfa(prixFinal(p) * x.l.q) : "Prix à confirmer") + "</span>") + "</div>" +
      '<div class="droite"><div class="quantite"><button type="button" data-qte="' + k + '" data-d="-1" aria-label="Retirer un">−</button><output>' + x.l.q + '</output><button type="button" data-qte="' + k + '" data-d="1" aria-label="Ajouter un">+</button></div><button class="retirer-ligne" type="button" data-retirer-ligne="' + k + '">Retirer</button></div></div>';
  }).join("");
  var nums = numeros(); if (client.num >= nums.length) client.num = 0;
  var opts = VILLES.map(function (v) { return '<option value="' + esc(v) + '"' + (client.ville === v ? " selected" : "") + ">" + esc(v) + "</option>"; }).join("");
  var bas = '<div class="total"><span>Total des articles</span><b>' + (tot ? fcfa(tot) : "—") + "</b></div>" +
    '<p class="note">' + (aConfirmer ? "Certains prix seront confirmés sur WhatsApp. " : "") + "Les frais de livraison s'ajoutent selon votre ville.</p>" +
    '<div class="livraison"><h4><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-camion"/></svg>Livraison</h4>' +
    '<div class="champ" id="champ-ville"><label for="ville">Votre ville <em>(obligatoire)</em></label><select id="ville" autocomplete="address-level2"><option value="">Choisissez votre ville</option>' + opts + '<option value="autre"' + (client.ville === "autre" ? " selected" : "") + ">Autre ville…</option></select></div>" +
    '<div class="champ" id="champ-autre"' + (client.ville === "autre" ? "" : " hidden") + '><label for="ville-autre">Nom de votre ville <em>(obligatoire)</em></label><input id="ville-autre" maxlength="60" value="' + esc(client.autre) + '"></div>' +
    '<p class="mode-livraison" id="mode-livraison">' + esc(modeLivraison()) + "</p>" +
    '<div class="champ"><label for="quartier">Quartier ou point de repère</label><input id="quartier" maxlength="120" autocomplete="street-address" placeholder="Ex. : Bonamoussadi, près du marché" value="' + esc(client.quartier) + '"></div>' +
    '<div class="champ"><label for="nom-client">Votre nom</label><input id="nom-client" maxlength="60" autocomplete="name" value="' + esc(client.nom) + '"></div></div>' +
    (nums.length > 1 ? '<h4 style="margin:18px 0 8px">Envoyer la commande au</h4><div class="numeros" role="group">' + nums.map(function (n, i) { return '<button class="puce" type="button" data-num="' + i + '" aria-pressed="' + (client.num === i) + '">' + esc(numeroLisible(n)) + "</button>"; }).join("") + "</div>" : "") +
    '<p class="msg-erreur" id="erreur-panier" role="alert" hidden></p>' +
    (dispo ? '<a class="bouton wa large" style="margin-top:16px" id="envoyer-panier" target="_blank" rel="noopener" href="' + esc(lienPanier()) + '"' + (villeClient() ? "" : ' data-attente="1"') + '><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-wa"/></svg>Envoyer ma commande sur WhatsApp</a>' +
      '<p class="note" style="text-align:center">WhatsApp s\'ouvre avec votre commande déjà écrite : il ne reste qu\'à l\'envoyer.</p>' : "");
  afficher(coque(titre + " · " + pluriel(nbArticles(), "article"), lignes + bas), "panier", garderPlace);
}
function lienPanier() { var nums = numeros(); return lienWa(messagePanier(), nums[client.num] || nums[0]); }
function majEnvoi() {
  ecrire("rlux-client", client);
  var a = $("envoyer-panier"); if (a) { a.href = lienPanier(); if (villeClient()) a.removeAttribute("data-attente"); else a.setAttribute("data-attente", "1"); }
  var m = $("mode-livraison"); if (m) m.textContent = modeLivraison();
  if (villeClient()) { var e = $("erreur-panier"); if (e) e.hidden = true; ["champ-ville", "champ-autre"].forEach(function (id) { var c = $(id); if (c) c.classList.remove("erreur"); }); }
}
voile.addEventListener("input", function (e) {
  var id = e.target.id;
  if (id === "ville") { client.ville = e.target.value; $("champ-autre").hidden = client.ville !== "autre"; if (client.ville === "autre") $("ville-autre").focus(); }
  else if (id === "ville-autre") client.autre = e.target.value;
  else if (id === "quartier") client.quartier = e.target.value;
  else if (id === "nom-client") client.nom = e.target.value;
  else return;
  majEnvoi();
});

/* Article épuisé : le client demande à être prévenu, la boutique le lui signale à sa visite suivante */
function ouvrirAlerte(id) {
  var p = trouver(id); if (!p) return;
  var t = "Bonjour Shopping R-Lux, pouvez-vous me prévenir quand cet article sera de nouveau disponible : " + p.nom + " ?";
  afficher(coque("Me prévenir", '<div class="ligne-panier" style="grid-template-columns:64px 1fr"><img src="' + esc(photo(p)) + '" alt=""><div><b>' + esc(p.nom) + "</b>" + ligneStock(p) + "</div></div>" +
    '<p class="note" style="margin:12px 0">Envoyez ce message à la boutique : elle vous écrira dès le retour de l\'article. Vous le verrez aussi ici à votre prochaine visite.</p>' +
    '<a class="bouton wa large" id="envoyer-alerte" data-alerte="' + esc(p.id) + '" target="_blank" rel="noopener" href="' + esc(lienWa(t)) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-wa"/></svg>Envoyer la demande</a>'), "alerte");
}
function verifierRetours() {
  var revenu = null;
  Object.keys(alertes).forEach(function (id) { var p = trouver(id); if (!p) { delete alertes[id]; return; } if (p.visible && p.stock !== "epuise") { revenu = revenu || p; delete alertes[id]; } });
  ecrire("rlux-alertes", alertes);
  if (revenu) setTimeout(function () { montrer("Bonne nouvelle : « " + revenu.nom + " » est de retour", function () { ouvrirFiche(revenu.id); }); }, 900);
}

/* Favoris et partage */
function basculerFavori(id, b) {
  var i = favoris.indexOf(id), oui = i < 0; if (oui) favoris.unshift(id); else favoris.splice(i, 1);
  ecrire("rlux-favoris", favoris); vibrer();
  document.querySelectorAll('[data-favori="' + CSS.escape(id) + '"]').forEach(function (x) { x.setAttribute("aria-pressed", oui); x.setAttribute("aria-label", oui ? "Retirer des favoris" : "Ajouter aux favoris"); });
  b.classList.remove("bat"); void b.offsetWidth; b.classList.add("bat");
  $("nb-favoris").textContent = favorisVisibles().length || "";
  if (voirFavoris && !oui && feuille !== "fiche") rendreBoutique();
  montrer(oui ? "Ajouté à vos favoris" : "Retiré de vos favoris");
}
function partager(p) {
  if (!p) return;
  var url = location.origin + "/#p=" + encodeURIComponent(p.id), txt = p.nom + " · " + prixTexte(p) + " · Shopping R-Lux";
  if (navigator.share) { navigator.share({ title: p.nom, text: txt, url: url }).catch(function () {}); return; }
  var fini = function () { montrer("Lien copié : collez-le dans WhatsApp"); };
  if (navigator.clipboard) navigator.clipboard.writeText(txt + "\n" + url).then(fini, function () { window.open("https://wa.me/?text=" + encodeURIComponent(txt + "\n" + url), "_blank", "noopener"); });
  else window.open("https://wa.me/?text=" + encodeURIComponent(txt + "\n" + url), "_blank", "noopener");
}

/* Messages courts */
var minuteToast = null;
function montrer(texte, action) {
  var t = $("toast"); t.textContent = texte; t.hidden = false; t.classList.toggle("action", !!action);
  t.onclick = action ? function () { t.hidden = true; action(); } : null;
  t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
  clearTimeout(minuteToast); minuteToast = setTimeout(function () { t.hidden = true; }, action ? 3600 : 2600);
}

/* Un seul gestionnaire de clics pour toute la page */
document.addEventListener("click", function (e) {
  var x, t = e.target;
  if (t.closest("[data-fermer]")) { fermer(); return; }
  if ((x = t.closest("[data-favori]"))) { basculerFavori(x.getAttribute("data-favori"), x); return; }
  if ((x = t.closest("[data-ajouter]"))) { ajouterPanier(x.getAttribute("data-ajouter"), "", 1, x); return; }
  if ((x = t.closest("[data-fiche]"))) { ouvrirFiche(x.getAttribute("data-fiche")); return; }
  if ((x = t.closest("[data-prevenir]"))) { ouvrirAlerte(x.getAttribute("data-prevenir")); return; }
  if (t.closest("[data-voir-panier]") || t.closest("#ouvrir-panier") || t.closest("#onglet-panier")) { ouvrirPanier(); return; }
  if ((x = t.closest("[data-voir-rayon]"))) { fermer(); choisirRayon(x.getAttribute("data-voir-rayon"), true); return; }
  if ((x = t.closest("[data-rayon]"))) { choisirRayon(x.getAttribute("data-rayon")); x.scrollIntoView({ inline: "center", block: "nearest", behavior: calme ? "auto" : "smooth" }); return; }
  if ((x = t.closest("[data-cat]"))) { cat = x.getAttribute("data-cat"); rendreBoutique(); return; }
  if ((x = t.closest("[data-aller]"))) { fermer(); $(x.getAttribute("data-aller")).scrollIntoView({ behavior: calme ? "auto" : "smooth" }); return; }
  if ((x = t.closest("[data-partager]"))) { partager(trouver(x.getAttribute("data-partager"))); return; }
  // Fiche : choix (taille, contenance), quantité, ajout
  if ((x = t.closest("[data-choix]"))) { choixFiche = x.getAttribute("data-choix"); document.querySelectorAll("[data-choix]").forEach(function (b) { b.setAttribute("aria-pressed", b === x); }); var c = $("choix"); c.classList.remove("erreur"); $("erreur-choix").hidden = true; vibrer(); return; }
  if ((x = t.closest("[data-fq]"))) { qteFiche = Math.min(20, Math.max(1, qteFiche + +x.getAttribute("data-fq"))); $("fq").textContent = qteFiche; vibrer(); return; }
  if ((x = t.closest("[data-ajouter-fiche]"))) {
    if (x.classList.contains("ajoute")) { ouvrirPanier(); return; }
    var p = trouver(x.getAttribute("data-ajouter-fiche")), opts = listeOptions(p);
    if (opts.length && !choixFiche) { $("choix").classList.add("erreur"); var er = $("erreur-choix"); er.hidden = false; er.textContent = RAYONS[p.rayon].choix + " avant d'ajouter l'article."; vibrer(); return; }
    ajouterPanier(p.id, choixFiche, qteFiche, x);
    x.classList.remove("or"); x.classList.add("ajoute"); x.innerHTML = "✓ Ajouté · voir le panier"; return;
  }
  // Panier
  if ((x = t.closest("[data-qte]"))) { var l = panier[+x.getAttribute("data-qte")]; if (l) { l.q += +x.getAttribute("data-d"); if (l.q < 1) panier.splice(panier.indexOf(l), 1); else l.q = Math.min(20, l.q); sauverPanier(); vibrer(); ouvrirPanier(true); rendreBoutique(); } return; }
  if ((x = t.closest("[data-retirer-ligne]"))) { panier.splice(+x.getAttribute("data-retirer-ligne"), 1); sauverPanier(); ouvrirPanier(true); rendreBoutique(); return; }
  if ((x = t.closest("[data-num]"))) { client.num = +x.getAttribute("data-num"); document.querySelectorAll("[data-num]").forEach(function (b) { b.setAttribute("aria-pressed", b === x); }); majEnvoi(); return; }
  if ((x = t.closest("#envoyer-panier"))) {
    if (!villeClient()) {
      e.preventDefault(); vibrer();
      var ch = client.ville === "autre" ? "champ-autre" : "champ-ville", er2 = $("erreur-panier");
      $(ch).classList.add("erreur"); er2.hidden = false; er2.textContent = "Indiquez votre ville pour que la boutique prépare la livraison.";
      var champ = $(ch).querySelector("select,input"); champ.focus(); champ.scrollIntoView({ block: "center", behavior: calme ? "auto" : "smooth" });
      return;
    }
    x.href = lienPanier(); montrer("Votre commande s'ouvre dans WhatsApp");
    if (!$("vider-panier")) x.insertAdjacentHTML("afterend", '<button class="bouton large" type="button" id="vider-panier" style="margin-top:8px">Message envoyé ? Vider le panier</button>');
    return;
  }
  if (t.closest("#vider-panier")) { panier = []; sauverPanier(); fermer(); rendreBoutique(); montrer("Panier vidé. Merci pour votre commande !"); return; }
  if ((x = t.closest("[data-alerte]"))) { alertes[x.getAttribute("data-alerte")] = Date.now(); ecrire("rlux-alertes", alertes); setTimeout(function () { if (feuille === "alerte") fermer(); rendreBoutique(); montrer("Demande envoyée : vous serez prévenu"); }, 300); return; }
});
var minuteRecherche = null;
$("recherche").addEventListener("input", function (e) { requete = e.target.value; clearTimeout(minuteRecherche); minuteRecherche = setTimeout(function () { if (requete.trim()) { voirFavoris = false; } rendreBoutique(); }, 120); });
$("recherche").addEventListener("keydown", function (e) { if (e.key === "Enter") e.target.blur(); });
$("effacer-recherche").addEventListener("click", function () { requete = ""; $("recherche").value = ""; rendreBoutique(); $("recherche").focus(); });
$("tri").addEventListener("change", function (e) { tri = e.target.value; rendreBoutique(); });
$("voir-favoris").addEventListener("click", function () { voirFavoris = !voirFavoris; rendreBoutique(); });

/* Relief 3D : les plaques de verre s'inclinent et le reflet suit le doigt ou la souris ;
   l'affiche d'accueil suit aussi l'inclinaison du téléphone. */
var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
var RELIEF = ".produit,.univ,.canal,.connexion,.tuile,.mini,.etapes-cmd li";
function incliner(el, x, y, fort) {
  var b = el.getBoundingClientRect(), px = Math.min(1, Math.max(0, (x - b.left) / b.width)), py = Math.min(1, Math.max(0, (y - b.top) / b.height)), k = el.classList.contains("produit") ? 1 : .5;
  el.style.transform = "perspective(800px) rotateX(" + ((.5 - py) * 14 * k).toFixed(2) + "deg) rotateY(" + ((px - .5) * 16 * k).toFixed(2) + "deg) translateZ(6px)" + (fort ? " scale(.975)" : "");
  el.style.setProperty("--mx", (px * 100).toFixed(1) + "%"); el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
}
function relacher(el) { el.classList.add("rebond"); el.style.transform = ""; clearTimeout(el._rebond); el._rebond = setTimeout(function () { el.classList.remove("rebond"); }, 650); }
if (!calme) {
  var appui = null;
  document.addEventListener("pointerdown", function (e) { var c = e.target.closest(RELIEF + ",.livre3d"); if (!c) return; appui = c; c.classList.remove("rebond"); c.classList.add("appui"); if (!c.classList.contains("livre3d")) incliner(c, e.clientX, e.clientY, true); }, { passive: true });
  document.addEventListener("pointermove", function (e) {
    if (appui) { if (!appui.classList.contains("livre3d")) incliner(appui, e.clientX, e.clientY, true); return; }
    if (e.pointerType !== "mouse") return;
    var c = e.target.closest(RELIEF); if (c) incliner(c, e.clientX, e.clientY, false);
  }, { passive: true });
  var finAppui = function () { if (appui) { appui.classList.remove("appui"); if (!appui.classList.contains("livre3d")) relacher(appui); appui = null; } };
  ["pointerup", "pointercancel"].forEach(function (t) { document.addEventListener(t, finAppui, { passive: true }); });
  document.addEventListener("pointerout", function (e) { if (e.pointerType !== "mouse") return; var c = e.target.closest(RELIEF); if (c && !c.contains(e.relatedTarget) && c !== appui) relacher(c); }, { passive: true });
  var aff = $("affiche"), scene = $("scene"), gyro = false;
  var pencher = function (ry, rx) { aff.style.transform = "rotateY(" + ry.toFixed(1) + "deg) rotateX(" + rx.toFixed(1) + "deg)"; };
  scene.addEventListener("pointermove", function (e) { var b = scene.getBoundingClientRect(); pencher(((e.clientX - b.left) / b.width - .5) * 28, (.5 - (e.clientY - b.top) / b.height) * 18); });
  scene.addEventListener("pointerdown", function (e) { var b = scene.getBoundingClientRect(); pencher(((e.clientX - b.left) / b.width - .5) * 34, (.5 - (e.clientY - b.top) / b.height) * 22); });
  scene.addEventListener("pointerleave", function () { if (!gyro) aff.style.transform = ""; });
  scene.addEventListener("pointerup", function () { if (!gyro) { aff.style.transform = ""; aff.classList.add("rebond"); setTimeout(function () { aff.classList.remove("rebond"); }, 650); } });
  window.addEventListener("deviceorientation", function (e) {
    if (e.gamma == null || e.beta == null) return; gyro = true;
    var g = Math.max(-30, Math.min(30, e.gamma)), bt = Math.max(-30, Math.min(30, e.beta - 45)); pencher(-14 + g * .9, 6 - bt * .5);
  }, { passive: true });
}

/* Barre d'onglets : la bulle de verre glisse vers l'onglet de la section visible */
var onglets = $("onglets"), bulle = $("bulle");
function ongletActif() {
  var cle = "accueil";
  if (!voile.hidden && feuille === "panier") cle = "panier";
  else {
    var ligne = innerHeight * .4;
    ["boutique", "livres", "contact"].forEach(function (id) { var s = $(id); if (s && !s.hidden && s.getBoundingClientRect().top < ligne) cle = id; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cle = "contact";
  }
  var actif = null;
  onglets.querySelectorAll("[data-onglet]").forEach(function (a) { var oui = a.getAttribute("data-onglet") === cle; if (oui) { actif = a; a.setAttribute("aria-current", "page"); } else a.removeAttribute("aria-current"); });
  if (actif && actif.offsetWidth) { bulle.style.opacity = 1; bulle.style.width = actif.offsetWidth + "px"; bulle.style.transform = "translateX(" + actif.offsetLeft + "px)"; }
}
var rafOnglet = 0;
window.addEventListener("scroll", function () { if (!rafOnglet) rafOnglet = requestAnimationFrame(function () { rafOnglet = 0; ongletActif(); }); }, { passive: true });
window.addEventListener("resize", ongletActif);

/* Navigation : #accueil, #boutique, #livres, #contact, #p=<article>, #r=<univers>, #panier, #admin */
function montrerVue(id) { ["vue-boutique", "vue-connexion", "vue-admin"].forEach(function (v) { $(v).hidden = v !== id; }); document.body.classList.toggle("mode-admin", id !== "vue-boutique"); }
function route() {
  var h = location.hash;
  if (h === "#admin") {
    fermer();
    if (gerant && adminCharge) { montrerVue("vue-admin"); rendreAdmin(); }
    else if (gerant) { montrerVue("vue-admin"); if (!chargementAdmin) chargerAdmin(); }
    else { montrerVue("vue-connexion"); preparerGoogle(); }
    scrollTo(0, 0); barre(); return;
  }
  var avant = !$("vue-boutique").hidden;
  montrerVue("vue-boutique"); barre();
  if (!avant) { rendreTout(); var s = h && h.length > 1 && /^#[a-z-]+$/.test(h) && $(h.slice(1)); if (s) s.scrollIntoView(); else scrollTo(0, 0); }
  lienDirect(); ongletActif();
}
function lienDirect() {
  if (!charge) return;
  var h = location.hash, m;
  if ((m = h.match(/^#p=(.+)$/))) { history.replaceState(null, "", location.pathname + location.search + "#boutique"); ouvrirFiche(decodeURIComponent(m[1])); }
  else if ((m = h.match(/^#r=([a-z]+)$/))) { history.replaceState(null, "", location.pathname + location.search + "#boutique"); choisirRayon(m[1], true); }
  else if (h === "#panier") { history.replaceState(null, "", location.pathname + location.search + "#boutique"); ouvrirPanier(); }
}
window.addEventListener("hashchange", route);

/* Invitation à installer l'appli (raccourci sur l'écran d'accueil) */
var invite = null, ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
function installee() { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
function proposer(delai) {
  if (installee() || Date.now() - lire("rlux-install-plus-tard", 0) < 14 * 864e5) return;
  setTimeout(function () { if (location.hash === "#admin" || !voile.hidden || installee()) return; $("installer").hidden = false; }, delai);
}
window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); invite = e; proposer(20000); });
if (ios && !installee()) { $("installer-texte").textContent = "Touchez Partager, puis « Sur l'écran d'accueil »."; $("installer-oui").textContent = "Compris"; proposer(30000); }
$("installer-oui").addEventListener("click", function () { $("installer").hidden = true; if (invite) { invite.prompt(); invite = null; } else ecrire("rlux-install-plus-tard", Date.now()); });
$("installer-non").addEventListener("click", function () { $("installer").hidden = true; ecrire("rlux-install-plus-tard", Date.now()); });
// Seulement à la racine du site (la boutique publiée), jamais depuis un sous-dossier d'un autre site
if ("serviceWorker" in navigator && /^\/(index\.html)?$/.test(location.pathname)) window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });

/* ========================= Espace gérant ========================= */
function appel(methode, corps, action) {
  var h = { "content-type": "application/json" }; if (gerant) h.authorization = "Bearer " + gerant.jeton;
  return fetch(API + (action ? "?action=" + action : ""), { method: methode, headers: h, body: corps ? JSON.stringify(corps) : undefined })
    .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) { var e = new Error(d.erreur || "Le serveur ne répond pas, réessayez."); e.statut = r.status; throw e; } return d; }); },
      function () { var e = new Error("Pas de connexion internet. Vérifiez le réseau puis réessayez."); e.statut = 0; throw e; });
}
function sessionPerdue(e) { if (e.statut === 401 || e.statut === 403) { deconnecter(); var rf = $("refus"); rf.hidden = false; rf.textContent = e.message; return true; } return false; }

/* Connexion avec Google */
var googlePret = false;
function preparerGoogle() {
  if (googlePret) return; googlePret = true;
  appel("GET", null, "config").then(function (c) {
    var att = $("google-attente");
    if (!c.clientId || !c.pret) { att.textContent = "L'espace gérant n'est pas encore configuré."; return; }
    var s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = function () {
      google.accounts.id.initialize({ client_id: c.clientId, callback: function (rep) { connexion(rep.credential); }, ux_mode: "popup", auto_select: false });
      att.remove(); google.accounts.id.renderButton($("btn-google"), { theme: "filled_black", size: "large", shape: "pill", text: "signin_with", locale: "fr", width: 280 });
    };
    s.onerror = function () { googlePret = false; att.textContent = "Impossible de joindre Google. Vérifiez la connexion internet, puis rechargez la page."; };
    document.head.appendChild(s);
  }).catch(function (e) { googlePret = false; $("google-attente").textContent = e.message; });
}
function connexion(credential) {
  var rf = $("refus"); rf.hidden = true;
  appel("POST", { action: "connexion", credential: credential }).then(function (g) {
    gerant = g; try { sessionStorage.setItem("rlux-gerant", JSON.stringify(g)); } catch (e) {}
    chargerAdmin();
  }).catch(function (e) { rf.hidden = false; rf.textContent = e.message; });
}
function deconnecter() {
  gerant = null; version = null; adminCharge = false; $("chargement").hidden = true; try { sessionStorage.removeItem("rlux-gerant"); } catch (e) {}
  if (window.google && google.accounts) google.accounts.id.disableAutoSelect();
  nouvellesPhotos = {}; route(); chargerBoutique();
}
var confirmerAbandon = false;
$("deconnexion").addEventListener("click", function () {
  if (modifie() && !confirmerAbandon) { confirmerAbandon = true; this.textContent = "Abandonner les changements ?"; var b = this; setTimeout(function () { confirmerAbandon = false; b.textContent = "Se déconnecter"; }, 3000); return; }
  confirmerAbandon = false; this.textContent = "Se déconnecter"; etat = JSON.parse(publie); deconnecter();
});

/* Tableau de bord */
var ouvert = null, rayonAdmin = "tous", rechercheAdmin = "", adminCharge = false, chargementAdmin = false;
function chargerAdmin() {
  adminCharge = false; chargementAdmin = true; route(); var ch = $("chargement"); ch.hidden = false; ch.textContent = "Chargement du tableau de bord…";
  return appel("GET", null, "donnees").then(function (d) {
    chargementAdmin = false;
    if (!modifie() || version === null) { etat = completer(d.donnees); publie = JSON.stringify(etat); version = d.version; charge = true; }
    comptes = d.comptes || []; proprio = d.proprietaire; gerant.email = d.moi;
    adminCharge = true; $("chargement").hidden = true; route(); rendreTout();
  }).catch(function (e) { chargementAdmin = false; $("chargement").textContent = e.message; sessionPerdue(e); });
}
function estProprio() { return !!gerant && gerant.email === proprio; }
function modifie() { return JSON.stringify(etat) !== publie; }
function options(liste, val) { return liste.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === val ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join(""); }
function listeRayons(avecTous) { return (avecTous ? [["tous", "Tous les univers"]] : []).concat(Object.keys(RAYONS).map(function (k) { return [k, RAYONS[k].nom]; })); }
function rendreAdmin() {
  $("qui").textContent = gerant.email + (estProprio() ? " (propriétaire)" : "");
  var c = etat.config;
  $("cfg-wa").value = c.whatsapp || ""; $("cfg-wa2").value = c.whatsapp2 || ""; $("cfg-mail").value = c.email || "";
  $("cfg-annonce").value = c.annonce || ""; $("cfg-fb").value = c.facebook || ""; $("cfg-tt").value = c.tiktok || "";
  $("cfg-groupe").value = c.groupe || ""; $("cfg-chaine").value = c.chaine || "";
  $("admin-rayon").innerHTML = options(listeRayons(true), rayonAdmin);
  rendreTuiles(); rendreComptes(); rendreListeAdmin(); barre();
}
function rendreTuiles() {
  $("tuiles").innerHTML = listeRayons(true).map(function (x) {
    var l = etat.produits.filter(function (p) { return x[0] === "tous" || p.rayon === x[0]; }), pr = l.filter(enPromo).length, ms = l.filter(function (p) { return !p.visible; }).length, ep = l.filter(function (p) { return p.stock === "epuise"; }).length;
    var d = [pr ? pr + " en promo" : "", ep ? ep + " épuisé" + (ep > 1 ? "s" : "") : "", ms ? ms + " masqué" + (ms > 1 ? "s" : "") : ""].filter(Boolean).join(" · ");
    return '<button type="button" class="tuile verre" data-tuile="' + x[0] + '" aria-pressed="' + (rayonAdmin === x[0]) + '"><small>' + esc(x[0] === "tous" ? "Tout" : RAYONS[x[0]].court || RAYONS[x[0]].nom) + "</small><b>" + l.length + "</b><span>" + (d || "&nbsp;") + "</span></button>";
  }).join("");
}
$("tuiles").addEventListener("click", function (e) { var b = e.target.closest("[data-tuile]"); if (!b) return; rayonAdmin = b.getAttribute("data-tuile"); $("admin-rayon").value = rayonAdmin; rendreTuiles(); rendreListeAdmin(); });
$("admin-rayon").addEventListener("change", function (e) { rayonAdmin = e.target.value; rendreTuiles(); rendreListeAdmin(); });
$("admin-recherche").addEventListener("input", function (e) { rechercheAdmin = e.target.value; rendreListeAdmin(); });
function rendreListeAdmin() {
  var a = analyser(rechercheAdmin);
  var l = etat.produits.map(function (p, i) { return [p, i]; }).filter(function (x) { return (rayonAdmin === "tous" || x[0].rayon === rayonAdmin) && (!a.mots.length || correspond(x[0], { mots: a.mots, budget: 0 })); });
  $("admin-compte").textContent = pluriel(l.length, "article");
  $("admin-liste").innerHTML = l.length ? l.map(function (x) { return ligneAdmin(x[0], x[1]); }).join("") : '<p class="note">Aucun article ici pour l\'instant. Touchez « + Ajouter un article », prenez une photo, entrez le prix, puis « Enregistrer ».</p>';
  barre();
}
function resume(p) { return enPromo(p) ? "<s>" + fcfa(p.prix) + "</s>" + fcfa(p.prixPromo) : p.prix ? fcfa(p.prix) : "Sur demande"; }
function apercu(p) {
  if (p.prixPromo > 0 && p.prixPromo >= p.prix) return "Le prix promo doit être plus bas que le prix normal.";
  if (enPromo(p)) return "En boutique : <s>" + fcfa(p.prix) + "</s> puis <b>" + fcfa(p.prixPromo) + "</b> (-" + remise(p) + " %)";
  return p.prix ? "Pas de promo : <b>" + fcfa(p.prix) + "</b>" : "Sans prix, l'article s'affiche « Prix sur demande ».";
}
function ligneAdmin(p, i) {
  var r = RAYONS[p.rayon], cats = r.cats.map(function (c) { return [c, c]; }), livre = p.rayon === "livres";
  if (p.categorie && r.cats.indexOf(p.categorie) < 0) cats.push([p.categorie, p.categorie]);
  var etiquettes = [nomRayon(p.rayon, true), p.categorie, p.visible ? "" : "masqué", p.stock === "epuise" ? "épuisé" : ""].filter(Boolean).join(" · ");
  return '<details class="fiche-admin" data-i="' + i + '"' + (ouvert === p.id ? " open" : "") + '><summary><img src="' + esc(photo(p)) + '" alt=""><span><b>' + esc(p.nom || "Sans nom") + "</b><small>" + esc(etiquettes) + '</small></span><span class="p" id="res-' + i + '">' + resume(p) + "</span></summary>" +
    '<div class="editeur"><div class="photos">' + p.photos.map(function (k, j) { return '<figure><img src="' + esc(photo(p, j)) + '" alt="Photo ' + (j + 1) + '"><button type="button" data-retirer-photo="' + j + '" aria-label="Retirer la photo ' + (j + 1) + '">×</button></figure>'; }).join("") +
    '<label class="ajout-photo">Prendre une photo<input type="file" accept="image/*" capture="environment" data-champ="photos" id="cam-' + i + '"></label>' +
    '<label class="ajout-photo">+ Galerie<input type="file" accept="image/*" multiple data-champ="photos" id="ph-' + i + '"></label></div>' +
    '<div class="champs">' +
    '<div class="champ large"><label for="nom-' + i + '">Nom de l\'article</label><input id="nom-' + i + '" data-champ="nom" value="' + esc(p.nom) + '" maxlength="120"></div>' +
    '<div class="champ"><label for="ray-' + i + '">Univers</label><select id="ray-' + i + '" data-champ="rayon">' + options(listeRayons(false), p.rayon) + "</select></div>" +
    '<div class="champ"><label for="cat-' + i + '">Catégorie</label><select id="cat-' + i + '" data-champ="categorie">' + options(cats, p.categorie) + "</select></div>" +
    (livre ? '<div class="champ"><label for="aut-' + i + '">Auteur</label><input id="aut-' + i + '" data-champ="auteur" value="' + esc(p.auteur) + '" maxlength="80"></div>' +
      '<div class="champ"><label for="lien-' + i + '">Lien de la version numérique</label><input id="lien-' + i + '" data-champ="lien" type="url" inputmode="url" value="' + esc(p.lien) + '" placeholder="https://…" maxlength="300"></div>' : "") +
    '<div class="champ"><label for="mar-' + i + '">' + (livre ? "Éditeur" : "Marque") + '</label><input id="mar-' + i + '" data-champ="marque" value="' + esc(p.marque) + '" maxlength="40"></div>' +
    '<div class="champ"><label for="opt-' + i + '">Choix proposés au client</label><input id="opt-' + i + '" data-champ="options" value="' + esc(p.options) + '" maxlength="200" placeholder="' + esc(r.exemple ? "Ex. : " + r.exemple : "Séparés par des virgules") + '"></div>' +
    '<div class="champ large"><label for="det-' + i + '">Description</label><textarea id="det-' + i + '" data-champ="details" maxlength="800" placeholder="' + (livre ? "Résumé du livre" : "Matière, parfum, contenance, conseils…") + '">' + esc(p.details) + "</textarea></div>" +
    '<div class="champ"><label for="prix-' + i + '">Prix (FCFA)</label><input id="prix-' + i + '" data-champ="prix" type="number" inputmode="numeric" step="500" min="0" value="' + (p.prix || "") + '" placeholder="vide = prix sur demande"></div>' +
    '<div class="champ"><label for="pp-' + i + '">Prix promo (FCFA)</label><input id="pp-' + i + '" data-champ="prixPromo" type="number" inputmode="numeric" step="500" min="0" value="' + (p.prixPromo || "") + '" placeholder="vide = pas de promo"></div>' +
    '<p class="apercu-prix large" id="ap-' + i + '">' + apercu(p) + "</p>" +
    '<div class="champ"><label for="stk-' + i + '">Stock</label><select id="stk-' + i + '" data-champ="stock">' + options([["ok", "En stock"], ["peu", "Dernières pièces"], ["epuise", "Épuisé"]], p.stock) + "</select></div>" +
    '<div class="champ case"><input id="nv-' + i + '" data-champ="nouveau" type="checkbox"' + (p.nouveau ? " checked" : "") + '><label for="nv-' + i + '">Badge « Nouveau »</label></div>' +
    '<div class="champ case"><input id="ve-' + i + '" data-champ="vedette" type="checkbox"' + (p.vedette ? " checked" : "") + '><label for="ve-' + i + '">À la une (accueil)</label></div>' +
    '<div class="champ case"><input id="vis-' + i + '" data-champ="visible" type="checkbox"' + (p.visible ? " checked" : "") + '><label for="vis-' + i + '">Afficher dans la boutique</label></div>' +
    '</div><div class="actions-admin"><button class="bouton petit" type="button" data-tete="' + i + '">Placer en tête</button><button class="bouton petit" type="button" data-dupliquer="' + i + '">Dupliquer</button><button class="danger" type="button" data-supprimer="' + i + '">Supprimer</button></div></div></details>';
}
function changer() { barre(); if (!$("vue-boutique").hidden) rendreTout(); }
function majConfig() {
  var c = etat.config;
  c.whatsapp = chiffres($("cfg-wa").value); c.whatsapp2 = chiffres($("cfg-wa2").value); c.email = $("cfg-mail").value.trim();
  c.annonce = $("cfg-annonce").value; c.facebook = adresseWeb($("cfg-fb").value); c.tiktok = adresseWeb($("cfg-tt").value);
  c.groupe = adresseWeb($("cfg-groupe").value); c.chaine = adresseWeb($("cfg-chaine").value);
  changer();
}
// Lien collé sans « https:// » (ex. chat.whatsapp.com/…) : complété, sinon le serveur le refuserait
function adresseWeb(v) { v = String(v || "").trim(); if (!v) return ""; return /^https?:\/\//i.test(v) ? v.replace(/^http:/i, "https:") : "https://" + v; }
["cfg-wa", "cfg-wa2", "cfg-mail", "cfg-annonce", "cfg-fb", "cfg-tt", "cfg-groupe", "cfg-chaine"].forEach(function (id) { $(id).addEventListener("input", majConfig); });
var liste = $("admin-liste");
liste.addEventListener("toggle", function (e) { var d = e.target, p = etat.produits[+d.getAttribute("data-i")]; if (!p) return; if (d.open) ouvert = p.id; else if (ouvert === p.id) ouvert = null; }, true);
liste.addEventListener("input", function (e) {
  var el = e.target, ch = el.getAttribute("data-champ"); if (!ch || ch === "photos") return;
  var i = +el.closest(".fiche-admin").getAttribute("data-i"), p = etat.produits[i];
  if (ch === "prix" || ch === "prixPromo") p[ch] = Math.max(0, Math.round(+el.value || 0));
  else if (ch === "visible" || ch === "nouveau" || ch === "vedette") p[ch] = el.checked;
  else p[ch] = el.value;
  if (ch === "rayon") { p.categorie = RAYONS[p.rayon].cats[0]; if (p.rayon === "livres" && !p.auteur) p.auteur = "Robyn Tyo’o"; }
  if (ch === "rayon" || ch === "visible" || ch === "stock") { rendreListeAdmin(); rendreTuiles(); changer(); return; }
  var ap = $("ap-" + i); if (ap) ap.innerHTML = apercu(p); $("res-" + i).innerHTML = resume(p);
  if (ch === "nom") el.closest(".fiche-admin").querySelector("summary b").textContent = p.nom || "Sans nom";
  rendreTuiles(); changer();
});
// Le téléphone réduit chaque photo (1000 px au plus grand côté) avant l'envoi : elle passe même en 3G
function reduire(fichier, fin) {
  var lecteur = new FileReader();
  lecteur.onload = function () {
    var img = new Image();
    img.onload = function () {
      var m = 1000, k = Math.min(1, m / Math.max(img.width, img.height)), cv = document.createElement("canvas");
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      var cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
      fin(cv.toDataURL("image/jpeg", .82));
    };
    img.onerror = function () { fin(null); }; img.src = lecteur.result;
  };
  lecteur.onerror = function () { fin(null); }; lecteur.readAsDataURL(fichier);
}
function cheminPhoto(p) { return "photos/" + String(p.id).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + ".jpg"; }
liste.addEventListener("change", function (e) {
  var el = e.target; if (el.getAttribute("data-champ") !== "photos" || !el.files.length) return;
  var i = +el.closest(".fiche-admin").getAttribute("data-i"), p = etat.produits[i], fichiers = Array.from(el.files).slice(0, 10), reste = fichiers.length;
  fichiers.forEach(function (f) { reduire(f, function (url) { if (url && p.photos.length < 10) { var ch = cheminPhoto(p); nouvellesPhotos[ch] = url; p.photos.push(ch); } else if (!url) montrer("Une photo n'a pas pu être lue"); if (--reste === 0) { rendreListeAdmin(); changer(); } }); });
});
var aSupprimer = null;
liste.addEventListener("click", function (e) {
  var b;
  if ((b = e.target.closest("[data-retirer-photo]"))) { var i = +b.closest(".fiche-admin").getAttribute("data-i"); etat.produits[i].photos.splice(+b.getAttribute("data-retirer-photo"), 1); rendreListeAdmin(); changer(); return; }
  if ((b = e.target.closest("[data-tete]"))) { var p = etat.produits.splice(+b.getAttribute("data-tete"), 1)[0]; etat.produits.unshift(p); ouvert = p.id; rendreListeAdmin(); changer(); montrer("« " + (p.nom || "Sans nom") + " » s'affiche en premier"); return; }
  if ((b = e.target.closest("[data-dupliquer]"))) { var j = +b.getAttribute("data-dupliquer"), o = etat.produits[j], c = P(JSON.parse(JSON.stringify(o))); c.id = nouvelId(); c.nom = o.nom + " (copie)"; etat.produits.splice(j + 1, 0, c); ouvert = c.id; rendreListeAdmin(); changer(); return; }
  if ((b = e.target.closest("[data-supprimer]"))) {
    var k = +b.getAttribute("data-supprimer");
    if (aSupprimer !== k) { aSupprimer = k; b.textContent = "Confirmer la suppression"; setTimeout(function () { if (aSupprimer === k) { aSupprimer = null; b.textContent = "Supprimer"; } }, 3000); return; }
    aSupprimer = null; etat.produits.splice(k, 1); rendreListeAdmin(); changer();
  }
});
$("ajouter").addEventListener("click", function () {
  var r = rayonAdmin === "tous" ? "parfums" : rayonAdmin, p = P({ nom: "Nouvel article", rayon: r, categorie: RAYONS[r].cats[0], auteur: r === "livres" ? "Robyn Tyo’o" : "" });
  etat.produits.unshift(p); ouvert = p.id; rechercheAdmin = ""; $("admin-recherche").value = ""; rendreListeAdmin(); changer();
  var n = $("nom-0"); if (n) { n.focus(); n.select(); }
});

/* Enregistrer : tous les changements partent d'un coup, en un seul commit */
function nbChangements() {
  var avant = JSON.parse(publie), n = 0, m = {};
  avant.produits.forEach(function (p) { m[p.id] = JSON.stringify(p); });
  etat.produits.forEach(function (p) { if (m[p.id] !== JSON.stringify(p)) n++; delete m[p.id]; });
  n += Object.keys(m).length;
  if (JSON.stringify(avant.config) !== JSON.stringify(etat.config)) n++;
  if (!n && modifie()) n = 1; // seul l'ordre a changé
  return n;
}
var enCours = false;
function barre() {
  var b = $("sauvegarde"), admin = location.hash === "#admin" && !!gerant && adminCharge;
  if (!admin || (!modifie() && !enCours)) { b.hidden = true; return; }
  b.hidden = false; b.classList.remove("erreur-sv"); var n = nbChangements();
  $("sv-texte").innerHTML = enCours ? "Enregistrement…" : pluriel(n, "changement") + '<i class="sv-plus"> à enregistrer</i>';
  $("enregistrer").disabled = enCours; $("annuler").hidden = enCours;
}
$("annuler").addEventListener("click", function () { etat = JSON.parse(publie); nouvellesPhotos = {}; ouvert = null; rendreAdmin(); rendreTout(); });
$("enregistrer").addEventListener("click", function () {
  if (enCours) return;
  var faux = etat.produits.filter(function (p) { return p.prixPromo > 0 && p.prixPromo >= p.prix; });
  if (faux.length) { montrer("Corrigez le prix promo de « " + (faux[0].nom || "Sans nom") + " » : il doit être plus bas que le prix normal."); return; }
  var sansNom = etat.produits.filter(function (p) { return !p.nom.trim(); });
  if (sansNom.length) { montrer("Un article n'a pas de nom : donnez-lui un nom avant d'enregistrer."); return; }
  enCours = true; barre();
  var utilisees = {}; etat.produits.forEach(function (p) { p.photos.forEach(function (k) { utilisees[k] = 1; }); });
  var photos = Object.keys(nouvellesPhotos).filter(function (k) { return utilisees[k]; }).map(function (k) { return { chemin: k, data: nouvellesPhotos[k] }; });
  var envoye = JSON.stringify(etat);
  appel("POST", { action: "enregistrer", donnees: etat, version: version, photos: photos }).then(function (r) {
    enCours = false; version = r.version; publie = envoye;
    montrer("Enregistré. Les clients le verront dans une minute environ."); barre(); rendreTuiles();
  }).catch(function (e) {
    enCours = false; barre();
    if (sessionPerdue(e)) return;
    var b = $("sauvegarde"); b.classList.add("erreur-sv"); $("sv-texte").textContent = e.statut === 409 ? "Conflit : rechargez la page" : "Échec, réessayez";
    montrer(e.message);
  });
});
window.addEventListener("beforeunload", function (e) { if (gerant && modifie()) { e.preventDefault(); e.returnValue = ""; } });

/* Gérants : seule la propriétaire ajoute ou retire */
function rendreComptes() {
  var p = estProprio();
  $("comptes").innerHTML = '<li><span>' + esc(proprio) + '</span><span class="droite"><span class="statut proprio">Propriétaire</span></span></li>' + comptes.map(function (x) {
    return "<li><span>" + esc(x.email) + '</span><span class="droite"><span class="statut ' + (x.statut === "actif" ? "actif" : "invite") + '">' + (x.statut === "actif" ? "Actif" : "Invité") + "</span>" + (p ? '<button class="lien-bouton" type="button" data-retirer-compte="' + esc(x.email) + '">Retirer</button>' : "") + "</span></li>";
  }).join("");
  $("zone-ajout-compte").hidden = !p; $("note-comptes").hidden = p;
}
$("ajouter-compte").addEventListener("click", function () {
  var ip = $("nouveau-compte"), m = ip.value.trim().toLowerCase(), er = $("erreur-compte"), bt = this;
  if (!/^[a-z0-9.+_-]+@(gmail|googlemail)\.com$/.test(m)) { er.hidden = false; er.textContent = "Entrez une adresse Gmail complète, par exemple prenom.nom@gmail.com."; return; }
  if (m === proprio || comptes.some(function (c) { return c.email === m; })) { er.hidden = false; er.textContent = "Ce compte est déjà gérant."; return; }
  er.hidden = true; bt.disabled = true; bt.textContent = "Ajout…";
  appel("POST", { action: "inviter", email: m }).then(function (r) {
    comptes = r.comptes; ip.value = ""; rendreComptes();
    var t = "Bonjour, vous êtes ajouté comme gérant de la boutique Shopping R-Lux. Ouvrez " + location.origin + "/#admin et connectez-vous avec votre compte Google " + m + ".";
    $("texte-invit").textContent = t; $("invit-wa").href = "https://wa.me/?text=" + encodeURIComponent(t); $("invitation").hidden = false;
  }).catch(function (e) { if (!sessionPerdue(e)) { er.hidden = false; er.textContent = e.message; } })
    .then(function () { bt.disabled = false; bt.textContent = "Ajouter"; });
});
$("copier-invit").addEventListener("click", function () { var t = $("texte-invit").textContent; if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { montrer("Message copié"); }, function () {}); });
$("comptes").addEventListener("click", function (e) {
  var b = e.target.closest("[data-retirer-compte]"); if (!b) return;
  var m = b.getAttribute("data-retirer-compte");
  if (b.getAttribute("data-confirmer") !== "1") { b.setAttribute("data-confirmer", "1"); b.textContent = "Confirmer"; setTimeout(function () { b.removeAttribute("data-confirmer"); b.textContent = "Retirer"; }, 3000); return; }
  b.disabled = true; b.textContent = "Retrait…";
  appel("POST", { action: "retirer", email: m }).then(function (r) { comptes = r.comptes; rendreComptes(); montrer(m + " n'a plus accès"); })
    .catch(function (e) { if (!sessionPerdue(e)) { montrer(e.message); rendreComptes(); } });
});

/* Démarrage : la page garde sa position quand une feuille se ferme avec le bouton Retour */
try { history.scrollRestoration = "manual"; } catch (e) {}
rendreTout(); route(); chargerBoutique();
