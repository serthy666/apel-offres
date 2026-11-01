// Parcours complet de la boutique Shopping R-Lux, sur téléphone et sur ordinateur, avec la vraie fonction gérant
// (GitHub et Google simulés par tests/serveur.mjs). Lancer : node tests/parcours.mjs
// Captures d'écran facultatives : CAPTURES=/un/dossier node tests/parcours.mjs
import { createRequire } from "node:module";
import { demarrer, PROPRIO, DOSSIER } from "./serveur.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const CAPTURES = process.env.CAPTURES || "";

let ok = 0, ko = 0;
function verifie(cond, quoi) { if (cond) ok++; else { ko++; console.log("  ÉCHEC :", quoi); } }

// Fausse bibliothèque Google : un bouton, et window.__google(email) simule le choix du compte
const FAUX_GIS = `window.google={accounts:{id:{initialize:function(o){window.__cb=o.callback},
  renderButton:function(el){var b=document.createElement("button");b.type="button";b.id="gis";b.textContent="Se connecter avec Google";el.appendChild(b)},
  disableAutoSelect:function(){}}}};window.__google=function(m){window.__cb({credential:"test:"+m})};`;

// Photo de 1600 x 1200 générée dans le navigateur (le téléphone doit la réduire à 1000 px)
async function image(p) {
  const b64 = await p.evaluate(() => { const c = document.createElement("canvas"); c.width = 1600; c.height = 1200; const x = c.getContext("2d"); x.fillStyle = "#7A1023"; x.fillRect(0, 0, 1600, 1200); x.fillStyle = "#E3B85A"; x.fillRect(500, 200, 600, 800); return c.toDataURL("image/png").split(",")[1]; });
  return { name: "parfum.png", mimeType: "image/png", buffer: Buffer.from(b64, "base64") };
}
function tailleJpeg(b) {
  if (!b || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length - 8) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1], n = b.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc3) return { h: b.readUInt16BE(i + 5), l: b.readUInt16BE(i + 7) }; i += 2 + n; }
  return null;
}

async function page(nav, vue, erreurs) {
  const ctx = await nav.newContext({ viewport: vue, hasTouch: vue.width < 700, isMobile: vue.width < 700, reducedMotion: "reduce" });
  await ctx.route("https://accounts.google.com/gsi/client", r => r.fulfill({ contentType: "text/javascript", body: FAUX_GIS }));
  await ctx.route(/^https:\/\/wa\.me\//, r => r.fulfill({ contentType: "text/html", body: "WhatsApp" }));
  const p = await ctx.newPage();
  p.on("pageerror", e => erreurs.push(e.message));
  p.on("console", m => { if (m.type() === "error" && !/401|403|409|Failed to load resource/.test(m.text())) erreurs.push(m.text()); });
  p.on("dialog", d => d.accept());
  p.ctx = ctx;
  return p;
}
const largeur = p => p.evaluate(() => document.documentElement.scrollWidth);
const cartes = p => p.locator("#grille .produit").count();
const produitsDepot = s => JSON.parse(s.depot.lire("donnees/produits.json")).produits;
const comptesDepot = s => JSON.parse(s.depot.lire("donnees/comptes.json")).comptes;
const texte = async (p, sel) => ((await p.locator(sel).first().textContent()) || "").replace(/[  ]/g, " ");
const message = async p => decodeURIComponent(((await p.locator("#envoyer-panier").getAttribute("href")) || "").split("?text=")[1] || "").replace(/[  ]/g, " ");
async function capture(p, nom, plein) { if (CAPTURES) await p.waitForTimeout(250), await p.screenshot({ path: CAPTURES + "/" + nom + ".png", fullPage: !!plein }); }
async function connecter(p, s, email) {
  await p.goto(s.url + "/#admin");
  await p.locator("#gis").waitFor();
  await p.evaluate(m => window.__google(m), email);
}
// Ouvre la fiche d'un article dans le tableau de bord et renvoie son numéro
async function ouvrir(p, nom) {
  const d = p.locator(".fiche-admin").filter({ has: p.locator("summary b", { hasText: nom }) }).first();
  if ((await d.getAttribute("open")) === null) await d.locator("summary").click();
  return d.getAttribute("data-i");
}
async function enregistrer(p) {
  await p.locator("#enregistrer").click();
  await p.waitForFunction(() => document.getElementById("sauvegarde").hidden || document.getElementById("sauvegarde").classList.contains("erreur-sv"));
}
function carte(p, nom) { return p.locator("#grille .produit").filter({ has: p.locator("h3", { hasText: nom }) }).first(); }

/* Côté client avec les deux livres livrés : panier, ville obligatoire, message WhatsApp */
async function client(p, s, vue, n) {
  await p.goto(s.url + "/");
  await p.locator("#grille .produit").first().waitFor();
  verifie(await cartes(p) === n, vue.width + " px : " + n + " articles en boutique");
  verifie(await p.locator("#univers .univ").count() === 5, "5 univers");
  verifie(await p.locator("#etagere .livre3d").count() === 2, "étagère : les 2 livres de Robyn");
  verifie((await texte(p, "#wa1-numero")).includes("676 962 519"), "numéro WhatsApp 676 962 519");
  verifie((await texte(p, "#wa2-numero")).includes("690 808 155"), "numéro WhatsApp et appel 690 808 155");
  verifie((await p.locator("#wa2-appel").getAttribute("href")) === "tel:+237690808155", "bouton Appeler");
  verifie((await texte(p, "#mail-adresse")) === "shoppingrlux12@gmail.com", "adresse e-mail");
  verifie(await p.locator("#communaute").isVisible(), "section Communauté WhatsApp");
  verifie((await p.locator("#lien-groupe").getAttribute("href")) === "https://chat.whatsapp.com/GFLtFN347yZFBPRGVMrK9G", "lien du groupe WhatsApp");
  verifie((await p.locator("#lien-chaine").getAttribute("href")) === "https://whatsapp.com/channel/0029VbEJaFuEgGfFLPiy1z2l", "lien de la chaîne WhatsApp");
  verifie((await p.locator("#pied-chaine").getAttribute("href")) === "https://whatsapp.com/channel/0029VbEJaFuEgGfFLPiy1z2l", "chaîne WhatsApp en pied de page");
  verifie(await largeur(p) <= vue.width, vue.width + " px : pas de défilement horizontal (accueil)");
  await capture(p, "accueil-" + vue.width);
  await capture(p, "page-" + vue.width, true);

  // Fiche d'un livre (couverture, résumé, auteur, version numérique)
  await p.locator('#etagere .livre3d[aria-label^="Dans le miroir"]').click();
  await p.locator(".fiche h2").waitFor();
  verifie((await texte(p, ".fiche h2")).includes("Dans le miroir de nos désirs"), "fiche du livre");
  verifie((await texte(p, ".fiche .auteur")).includes("Robyn Tyo’o"), "auteur affiché");
  verifie(await p.locator('.fiche a[href*="youscribe.com"]').count() === 1, "lien vers la version numérique");
  await capture(p, "fiche-livre-" + vue.width);
  await p.locator("#ajouter-fiche").click();
  verifie(await texte(p, "#nb-panier-2") === "1", "livre ajouté depuis sa fiche");
  await p.locator(".fiche [data-fermer]").click();
  await p.locator("#voile").waitFor({ state: "hidden" });

  // Panier : la ville est obligatoire avant l'envoi
  await carte(p, "Souhaits maudits").locator("[data-ajouter]").click();
  verifie(await texte(p, "#nb-panier") === "2", "badge du panier à 2");
  await p.locator("#onglet-panier").click();
  await p.locator(".ligne-panier").first().waitFor();
  verifie(await p.locator(".ligne-panier").count() === 2, "2 lignes dans le panier");
  verifie((await texte(p, ".total b")).includes("10 000 FCFA"), "total 10 000 FCFA");
  const pages = []; p.ctx.on("page", x => pages.push(x));
  await p.locator("#envoyer-panier").click();
  await p.waitForTimeout(300);
  verifie(pages.length === 0, "pas d'envoi WhatsApp sans ville");
  verifie(await p.locator("#erreur-panier").isVisible(), "message : indiquez votre ville");
  verifie(await p.locator("#champ-ville.erreur").count() === 1, "champ ville signalé");
  await p.selectOption("#ville", "Douala");
  let m = await message(p);
  verifie(m.includes("1 × Dans le miroir de nos désirs (Tome 1) : 5 000 FCFA") && m.includes("1 × Souhaits maudits : 5 000 FCFA"), "message : les deux livres");
  verifie(m.includes("Total des articles : 10 000 FCFA"), "message : total");
  verifie(m.includes("Ville : Douala (livraison)") && m.includes("frais de livraison"), "message : Douala, livraison");
  verifie(await p.locator("#erreur-panier").isHidden(), "erreur effacée une fois la ville choisie");
  verifie(await largeur(p) <= vue.width, vue.width + " px : pas de défilement horizontal (panier)");
  await capture(p, "panier-" + vue.width);
  const [wa] = await Promise.all([p.ctx.waitForEvent("page"), p.locator("#envoyer-panier").click()]);
  verifie(wa.url().startsWith("https://wa.me/237676962519?text="), "commande envoyée au 676 962 519");
  await wa.close();
  await p.locator("#vider-panier").click();
  verifie(await p.locator("#nb-panier").isHidden(), "panier vidé après l'envoi");
  verifie(await p.evaluate(() => JSON.parse(localStorage.getItem("rlux-client")).ville) === "Douala", "la ville est retenue pour la prochaine commande");
}

/* Parcours complet : espace gérant, puis vue client avec les nouveaux articles */
async function complet(nav, vue) {
  console.log("\n== " + vue.width + " px, parcours complet");
  const s = await demarrer(), erreurs = [];
  const p2 = await page(nav, vue, erreurs);
  await client(p2, s, vue, 2);

  // Espace gérant : un compte inconnu est refusé, la propriétaire entre
  const p = await page(nav, vue, erreurs);
  await connecter(p, s, "intrus@gmail.com");
  await p.locator("#refus").waitFor({ state: "visible" });
  verifie((await texte(p, "#refus")).includes("n'a pas accès"), "compte non autorisé refusé");
  await p.evaluate(m => window.__google(m), PROPRIO);
  await p.locator("#tuiles .tuile").first().waitFor();
  verifie((await texte(p, "#qui")).includes("(propriétaire)"), "propriétaire connectée");
  verifie(await p.locator(".onglets").isHidden(), "pas de barre d'onglets dans l'espace gérant");
  await capture(p, "admin-" + vue.width);

  // Un parfum avec photo et contenances
  const depart = s.depot.journal.length;
  await p.locator("#ajouter").click();
  await p.fill("#nom-0", "Eau de parfum Rose d'Or");
  await p.selectOption("#cat-0", "Parfums");
  await p.fill("#opt-0", "50 ml, 100 ml");
  await p.fill("#det-0", "Notes de rose et de vanille.\nTenue longue.");
  await p.fill("#prix-0", "15000");
  await p.setInputFiles("#ph-0", await image(p));
  await p.locator('.fiche-admin[data-i="0"] .photos figure').first().waitFor();
  verifie(await p.locator("#sauvegarde").isVisible(), "barre d'enregistrement visible");
  await capture(p, "admin-article-" + vue.width);
  // Un boxer en promo, avec tailles
  await p.locator('[data-tuile="lingerie"]').click();
  await p.locator("#ajouter").click();
  await p.fill("#nom-0", "Boxer coton homme");
  await p.selectOption("#cat-0", "Sous-vêtements hommes");
  await p.fill("#opt-0", "M, L, XL");
  await p.fill("#prix-0", "3500");
  await p.fill("#pp-0", "3000");
  verifie((await texte(p, "#ap-0")).includes("-14 %"), "aperçu de la remise");
  // Un sac épuisé
  await p.locator('[data-tuile="accessoires"]').click();
  await p.locator("#ajouter").click();
  await p.fill("#nom-0", "Sac à main cuir noir");
  await p.fill("#prix-0", "25000");
  await p.selectOption("#stk-0", "epuise");
  // Prix promo plus cher que le prix normal : refusé avant l'envoi
  await p.fill("#pp-0", "30000");
  await p.locator("#enregistrer").click();
  await p.waitForTimeout(200);
  verifie((await texte(p, "#toast")).includes("Corrigez le prix promo"), "promo plus chère refusée");
  verifie(s.depot.journal.length === depart, "rien n'est envoyé avec une promo fausse");
  await p.fill("#pp-0", "");
  await enregistrer(p);
  verifie(s.depot.journal.length === depart + 1, "un seul commit pour l'enregistrement");
  const msg = s.depot.journal.at(-1);
  verifie(msg.startsWith("R-Lux : Ajout") && msg.endsWith("(" + PROPRIO + ")"), "message du commit : qui a ajouté quoi (" + msg + ")");
  let prods = produitsDepot(s);
  verifie(prods.length === 5, "5 articles dans le dépôt");
  const parfum = prods.find(x => x.nom === "Eau de parfum Rose d'Or"), boxer = prods.find(x => x.nom === "Boxer coton homme"), sac = prods.find(x => x.nom === "Sac à main cuir noir");
  verifie(parfum && parfum.options === "50 ml, 100 ml" && parfum.details.includes("\n"), "parfum : contenances et description sur deux lignes");
  verifie(boxer && boxer.rayon === "lingerie" && boxer.prixPromo === 3000, "boxer : lingerie, promo 3 000");
  verifie(sac && sac.rayon === "accessoires" && sac.stock === "epuise", "sac : épuisé");
  const ph = parfum && parfum.photos[0], fichier = ph && s.depot.brut(ph), taille = tailleJpeg(fichier);
  verifie(/^photos\/[a-z0-9-]+\.jpg$/.test(ph || "") && taille && taille.l === 1000 && taille.h === 750, "photo réduite à 1000 px en JPEG dans " + DOSSIER + "photos/ (" + JSON.stringify(taille) + ")");
  verifie(s.depot.fichiers().get("index.html").toString().startsWith("APEL"), "le reste du dépôt n'est pas touché");

  // Ajout d'un gérant par son Gmail
  await p.fill("#nouveau-compte", "pas-un-mail");
  await p.locator("#ajouter-compte").click();
  verifie(await p.locator("#erreur-compte").isVisible(), "adresse non Gmail refusée");
  await p.fill("#nouveau-compte", "gerant.test@gmail.com");
  await p.locator("#ajouter-compte").click();
  await p.locator("#invitation").waitFor({ state: "visible" });
  verifie(comptesDepot(s).some(c => c.email === "gerant.test@gmail.com" && c.statut === "invite"), "gérant invité dans le dépôt");
  verifie((await texte(p, "#texte-invit")).includes("/#admin"), "message d'invitation avec le lien");

  // Vue client : les nouveaux articles, le choix de la contenance, les deux numéros
  await p2.goto(s.url + "/");
  await p2.locator("#grille .produit").nth(4).waitFor();
  verifie(await cartes(p2) === 5, "5 articles côté client");
  verifie((await texte(p2, '[data-voir-rayon="lingerie"] em')) === "1 article", "univers Lingerie : 1 article");
  const cb = carte(p2, "Boxer coton homme");
  const nb = t => t.replace(/[\u00a0\u202f]/g, " ");
  verifie(nb(await cb.locator(".prix s").textContent()) === "3 500 FCFA" && nb(await cb.locator(".prix b").textContent()) === "3 000 FCFA", "boxer : prix barré puis prix promo");
  verifie(await cb.locator(".badge.promo").count() === 1, "badge de remise");
  verifie(await carte(p2, "Sac à main cuir noir").locator("[data-prevenir]").count() === 1, "sac épuisé : bouton Me prévenir");
  await carte(p2, "Rose d'Or").locator("[data-fiche]", { hasText: "Choisir" }).click();
  await p2.locator("#ajouter-fiche").waitFor();
  await p2.locator("#ajouter-fiche").click();
  verifie(await p2.locator("#erreur-choix").isVisible(), "contenance à choisir avant l'ajout");
  await p2.locator('[data-choix="100 ml"]').click();
  await p2.locator('[data-fq="1"]').click();
  await capture(p2, "fiche-" + vue.width);
  await p2.locator("#ajouter-fiche").click();
  verifie(await texte(p2, "#nb-panier") === "2", "2 parfums au panier");
  await p2.locator(".fiche [data-fermer]").click();
  await carte(p2, "Boxer coton homme").locator("[data-fiche]", { hasText: "Choisir" }).click();
  await p2.locator('[data-choix="L"]').click();
  await p2.locator("#ajouter-fiche").click();
  await p2.locator(".fiche [data-fermer]").click();
  await p2.locator("#ouvrir-panier").click();
  await p2.locator(".ligne-panier").nth(1).waitFor();
  verifie((await p2.locator("#ville").inputValue()) === "Douala", "ville déjà remplie (commande précédente)");
  await p2.selectOption("#ville", "Yaoundé");
  await p2.fill("#quartier", "Bastos");
  await p2.fill("#nom-client", "Marie");
  let m = await message(p2);
  verifie(m.includes("2 × Eau de parfum Rose d'Or (100 ml) : 30 000 FCFA"), "message : 2 parfums de 100 ml");
  verifie(m.includes("1 × Boxer coton homme (L) : 3 000 FCFA"), "message : boxer taille L au prix promo");
  verifie(m.includes("Total des articles : 33 000 FCFA"), "message : total 33 000 FCFA");
  verifie(m.includes("Ville : Yaoundé (expédition)") && m.includes("frais d'expédition"), "message : expédition vers Yaoundé");
  verifie(m.includes("Quartier : Bastos") && m.includes("Nom : Marie"), "message : quartier et nom");
  await p2.locator('[data-num="1"]').click();
  verifie((await p2.locator("#envoyer-panier").getAttribute("href")).startsWith("https://wa.me/237690808155?"), "envoi possible au second numéro");
  await p2.selectOption("#ville", "autre");
  verifie(await p2.locator("#ville-autre").isVisible() && (await p2.locator("#envoyer-panier").getAttribute("data-attente")) === "1", "autre ville : nom à écrire");
  await p2.fill("#ville-autre", "Mvangan");
  verifie((await message(p2)).includes("Ville : Mvangan (expédition)"), "message : ville écrite à la main");
  await p2.locator('.ligne-panier [data-d="-1"]').first().click();
  verifie((await message(p2)).includes("1 × Eau de parfum Rose d'Or (100 ml) : 15 000 FCFA"), "quantité réduite dans le panier");
  await capture(p2, "panier-complet-" + vue.width);
  await p2.locator(".fiche [data-fermer]").click();

  // Recherche : synonymes, budget, rien trouvé
  const cherche = async (q, n, quoi) => { await p2.fill("#recherche", q); await p2.waitForTimeout(250); const c = await cartes(p2); verifie(c === n, quoi + " (" + c + ")"); };
  await cherche("boxer", 1, "recherche « boxer »");
  await cherche("culotte", 1, "synonyme : « culotte » trouve la lingerie");
  await cherche("eau de toilette", 1, "synonyme : « eau de toilette » trouve le parfum");
  await cherche("roman", 2, "« roman » trouve les livres");
  await cherche("moins de 10 000", 3, "budget : moins de 10 000 FCFA");
  await cherche("xyzabc", 0, "recherche sans résultat");
  verifie(await p2.locator('#grille .vide a[href*="wa.me"]').count() === 1, "sans résultat : demander sur WhatsApp");
  await p2.locator("#effacer-recherche").click();
  // Univers et catégories
  await p2.locator('#puces-rayons [data-rayon="livres"]').click();
  verifie(await cartes(p2) === 2, "univers Livres : 2 articles");
  await p2.locator('#puces-rayons [data-rayon="soins"]').click();
  verifie(await cartes(p2) === 0 && (await p2.locator('#grille .vide a[href*="wa.me"]').count()) === 1, "univers vide : demande sur WhatsApp");
  verifie(await p2.locator('#grille .vide a[href*="whatsapp.com/channel"]').count() === 1, "univers vide : suivre la chaîne pour les arrivages");
  await p2.locator('#puces-rayons [data-rayon="tous"]').click();
  // Favoris
  await carte(p2, "Boxer coton homme").locator(".coeur").click();
  await p2.locator("#voir-favoris").click();
  verifie(await cartes(p2) === 1, "favoris : 1 article");
  await p2.locator("#voir-favoris").click();
  // Article épuisé : demande de rappel
  await carte(p2, "Sac à main cuir noir").locator("[data-prevenir]").click();
  verifie(decodeURIComponent(await p2.locator("#envoyer-alerte").getAttribute("href")).includes("Sac à main cuir noir"), "message de rappel pour le sac");
  const [wa2] = await Promise.all([p2.ctx.waitForEvent("page"), p2.locator("#envoyer-alerte").click()]);
  await wa2.close();
  // Lien partagé d'un article
  await p2.goto(s.url + "/#p=" + boxer.id);
  await p2.locator(".fiche h2").waitFor();
  verifie((await texte(p2, ".fiche h2")) === "Boxer coton homme", "lien partagé : la fiche s'ouvre");
  await p2.locator(".fiche [data-fermer]").click();

  // Le gérant invité entre : il devient actif, sans droit d'ajouter d'autres gérants
  const p3 = await page(nav, vue, erreurs);
  await connecter(p3, s, "gerant.test@gmail.com");
  await p3.locator("#tuiles .tuile").first().waitFor();
  verifie(comptesDepot(s).some(c => c.email === "gerant.test@gmail.com" && c.statut === "actif"), "gérant passé à Actif");
  verifie(await p3.locator("#zone-ajout-compte").isHidden() && await p3.locator("#note-comptes").isVisible(), "un gérant ne peut pas ajouter de gérant");
  let i = await ouvrir(p3, "Souhaits maudits");
  await p3.fill("#prix-" + i, "4500");
  await enregistrer(p3);
  verifie(s.depot.journal.at(-1).includes("Prix Souhaits maudits : 5 000 → 4 500 (gerant.test@gmail.com)"), "commit du gérant : nouveau prix");

  // Conflit : la propriétaire repart d'une ancienne version
  i = await ouvrir(p, "Sac à main cuir noir");
  await p.selectOption("#stk-" + i, "ok");
  await enregistrer(p);
  verifie((await texte(p, "#sv-texte")).includes("Conflit"), "conflit entre deux gérants signalé");
  await p.reload();
  await p.locator("#tuiles .tuile").first().waitFor();
  i = await ouvrir(p, "Sac à main cuir noir");
  await p.selectOption("#stk-" + i, "ok");
  await enregistrer(p);
  verifie(produitsDepot(s).find(x => x.nom === "Sac à main cuir noir").stock === "ok", "sac de retour en stock");
  verifie(produitsDepot(s).find(x => x.nom === "Souhaits maudits").prix === 4500, "le prix du gérant est conservé");
  // Le client qui avait demandé le sac est prévenu à sa visite
  await p2.goto(s.url + "/");
  await p2.locator("#toast").waitFor({ state: "visible" });
  verifie((await texte(p2, "#toast")).includes("est de retour"), "client prévenu du retour du sac");

  // Retrait du gérant : sa session est coupée
  await p.locator('[data-retirer-compte="gerant.test@gmail.com"]').click();
  await p.locator('[data-retirer-compte="gerant.test@gmail.com"]').click();
  await p.waitForFunction(() => !document.querySelector('[data-retirer-compte="gerant.test@gmail.com"]'));
  verifie(comptesDepot(s).length === 0, "gérant retiré du dépôt");
  i = await ouvrir(p3, "Boxer coton homme");
  await p3.fill("#prix-" + i, "4000");
  await p3.locator("#enregistrer").click();
  await p3.locator("#refus").waitFor({ state: "visible" });
  verifie((await texte(p3, "#refus")).includes("n'a plus accès"), "gérant retiré : accès coupé");

  // Suppression d'un article : sa photo quitte le dépôt
  i = await ouvrir(p, "Eau de parfum Rose d'Or");
  await p.locator('[data-supprimer="' + i + '"]').click();
  await p.locator('[data-supprimer="' + i + '"]').click();
  await enregistrer(p);
  verifie(produitsDepot(s).length === 4 && !s.depot.brut(ph), "article et photo supprimés du dépôt");
  verifie(s.depot.journal.at(-1).includes("Suppression Eau de parfum Rose d'Or"), "commit de suppression");

  // Annonce et coordonnées
  await p.fill("#cfg-annonce", "Nouvel arrivage de parfums !");
  await enregistrer(p);
  await p2.goto(s.url + "/");
  await p2.locator("#annonce").waitFor({ state: "visible" });
  verifie((await texte(p2, "#annonce")) === "Nouvel arrivage de parfums !", "annonce affichée en boutique");
  // Groupe et chaîne WhatsApp modifiables : lien collé sans https complété, lien vide qui masque le bouton
  await p.fill("#cfg-groupe", "chat.whatsapp.com/NouveauGroupe1");
  await p.fill("#cfg-chaine", "");
  await enregistrer(p);
  const cfg = JSON.parse(s.depot.lire("donnees/produits.json")).config;
  verifie(cfg.groupe === "https://chat.whatsapp.com/NouveauGroupe1" && cfg.chaine === "", "groupe et chaîne enregistrés dans le dépôt");
  verifie(s.depot.journal.at(-1).includes("Coordonnées"), "commit : coordonnées modifiées");
  await p2.goto(s.url + "/");
  await p2.locator("#grille .produit").first().waitFor();
  verifie((await p2.locator("#lien-groupe").getAttribute("href")) === "https://chat.whatsapp.com/NouveauGroupe1" && await p2.locator("#lien-chaine").isHidden(), "boutique : nouveau groupe, chaîne masquée");

  // Appli installable
  verifie(await p2.evaluate(() => Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise(r => setTimeout(() => r(false), 5000))])), "service worker actif (appli installable)");
  const man = await (await fetch(s.url + "/manifest.webmanifest")).json();
  verifie(man.name === "Shopping R-Lux" && man.icons.some(x => x.purpose === "maskable"), "manifeste de l'appli");
  verifie(await largeur(p) <= vue.width && await largeur(p2) <= vue.width, vue.width + " px : pas de défilement horizontal (fin)");
  verifie(!erreurs.length, "aucune erreur dans la page " + erreurs.join(" | "));
  for (const x of [p, p2, p3]) await x.ctx.close();
  await s.arreter();
}

async function simple(nav, vue) {
  console.log("\n== " + vue.width + " px, parcours client");
  const s = await demarrer(), erreurs = [];
  const p = await page(nav, vue, erreurs);
  await client(p, s, vue, 2);
  verifie(!erreurs.length, "aucune erreur dans la page " + erreurs.join(" | "));
  await p.ctx.close(); await s.arreter();
}

const nav = await chromium.launch();
try {
  await complet(nav, { width: 390, height: 844 });
  await simple(nav, { width: 320, height: 640 });
  await simple(nav, { width: 768, height: 1024 });
  await complet(nav, { width: 1280, height: 900 });
} finally { await nav.close(); }
console.log("\n" + ok + " vérifications réussies, " + ko + " en échec");
process.exit(ko ? 1 : 0);
