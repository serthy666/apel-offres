// Parcours complet du Salon de lecture (Playwright) : node tests/salon.mjs
// Gérant : connexion Google, import d'un fichier Word, publication, codes 24 h / semaine / mois / promo, révocation, gérants.
// Lecteur : Salon vide puis rempli, chapitre offert, verrou, demande de code sur WhatsApp, activation (champ et lien),
// limite de 2 appareils, promo limitée, réactions, carnet et badges, carte-citation, réglages de la liseuse.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { demarrer, PROPRIO } from "./serveur.mjs";
import { fabriquerDocx } from "./docx.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "salon-"));
const FAUX_GIS = `window.google={accounts:{id:{initialize:function(o){window.__cb=o.callback},
  renderButton:function(el){el.innerHTML='<button id="faux-google">Se connecter avec Google</button>'},
  disableAutoSelect:function(){}}}};window.__google=function(m){window.__cb({credential:"test:"+m})};`;

const LIVRE = [
  { style: "Title", runs: [["Souhaits maudits", ""]] },
  { centre: true, runs: [["À ma mère.", "i"]] },
  { style: "Heading1", runs: [["Chapitre 1 : La promesse", ""]] },
  { runs: [["Il était une fois une ", ""], ["jeune femme", "b"], [" pleine de vie qui ", ""], ["rêvait", "i"], [" de Douala.", ""]] },
  "Elle marchait chaque matin jusqu'au marché, le cœur léger, sans savoir ce qui l'attendait.",
  { centre: true, runs: [["* * *", ""]] },
  { style: "Quote", runs: [["« Méfie-toi de ce que tu souhaites », disait sa grand-mère.", ""]] },
  { style: "Heading1", runs: [["Chapitre 2 : Le pacte", ""]] },
  "La nuit tomba sur Bonabéri. Un inconnu frappa à la porte.",
  { style: "Heading1", runs: [["Chapitre 3 : Les ombres", ""]] },
  "Rien ne fut plus jamais comme avant."
];
const SUITE = [{ style: "Heading1", runs: [["Chapitre 4 : Le retour", ""]] }, "Elle revint au village, changée."];
const fichierLivre = path.join(TMP, "souhaits-maudits.docx"); fs.writeFileSync(fichierLivre, fabriquerDocx(LIVRE));
const fichierSuite = path.join(TMP, "suite.docx"); fs.writeFileSync(fichierSuite, fabriquerDocx(SUITE));

const s = await demarrer();
const navigateur = await chromium.launch();
const erreurs = [];
let etape = "";
function log(t) { etape = t; console.log("• " + t); }

async function contexte(opts = {}) {
  const ctx = await navigateur.newContext({ viewport: { width: opts.largeur || 390, height: 800 }, locale: "fr-FR", serviceWorkers: "block", ...opts.ctx });
  await ctx.route(/docs\.google\.com/, r => r.abort());
  await ctx.route(/googleusercontent|drive\.google/, r => r.abort());
  await ctx.route("https://accounts.google.com/gsi/client", r => r.fulfill({ contentType: "text/javascript", body: FAUX_GIS }));
  return ctx;
}
async function page(ctx) {
  const p = await ctx.newPage();
  p.on("pageerror", e => erreurs.push(etape + " : " + e.message));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR/.test(m.text())) erreurs.push(etape + " : " + m.text()); });
  return p;
}
async function pasDeDefilement(p, quoi) {
  const l = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(l <= 1, quoi + " : défilement horizontal de " + l + " px");
}
async function api(action, corps, jeton) {
  const r = await fetch(s.url + "/api/" + action, { method: corps ? "POST" : "GET", headers: { "content-type": "application/json", ...(jeton ? { authorization: "Bearer " + jeton } : {}) }, body: corps ? JSON.stringify(corps) : undefined });
  return { statut: r.status, d: await r.json() };
}

try {
  /* ---------- Salon vide ---------- */
  log("Salon vide : l'accueil reste comme avant");
  const ctxL = await contexte();
  const lecteur = await page(ctxL);
  await lecteur.goto(s.url + "/");
  await lecteur.waitForSelector(".heros");
  await lecteur.waitForTimeout(300);
  assert.equal(await lecteur.locator(".salon-accueil").count(), 0, "pas de bloc Salon sans livre");
  await lecteur.goto(s.url + "/#/lire");
  await lecteur.waitForSelector("text=arrivent très bientôt");

  /* ---------- Gérant ---------- */
  log("Espace gérant : compte refusé, puis propriétaire");
  const ctxG = await contexte({ largeur: 1100 });
  const g = await page(ctxG);
  await g.goto(s.url + "/gerant.html");
  await g.waitForSelector("#faux-google");
  await g.evaluate(() => window.__google("inconnu@gmail.com"));
  await g.waitForSelector("#refus:not([hidden])");
  assert.match(await g.textContent("#refus"), /n'a pas accès/);
  await g.evaluate(m => window.__google(m), PROPRIO);
  await g.waitForSelector("text=Code pour un lecteur");
  assert.match(await g.textContent("#qui"), /apeledition@gmail.com · propriétaire/);

  log("Import du fichier Word et publication");
  await g.click("[data-onglet=livres]");
  await g.click("text=Ajouter un livre");
  await g.selectOption("#ed-cat", "souhaits-maudits");
  assert.equal(await g.inputValue("#ed-titre"), "Souhaits maudits");
  assert.equal(await g.inputValue("#ed-auteur"), "Robyn Tyo’o");
  await g.setInputFiles("#ed-fichier", fichierLivre);
  await g.waitForSelector("text=4 chapitres trouvés");
  const titres = await g.$$eval("[data-titre]", l => l.map(x => x.value));
  assert.deepEqual(titres, ["Début du document", "Chapitre 1 : La promesse", "Chapitre 2 : Le pacte", "Chapitre 3 : Les ombres"]);
  assert.equal(await g.isChecked("[data-garder='0']"), false, "la dédicace courte n'est pas publiée");
  await g.click("[data-apercu='1']");
  assert.equal(await g.locator(".apercu strong").first().textContent(), "jeune femme");
  assert.equal(await g.locator(".apercu em").first().textContent(), "rêvait");
  await g.fill("[data-titre='3']", "Chapitre 3 : Les ombres de la nuit");
  await g.click("#ed-publier");
  await g.waitForSelector("text=Publié : 3 chapitres en ligne");
  await g.waitForSelector(".liste >> text=Souhaits maudits");

  log("Codes : semaine pour un lecteur, 24 h, promo");
  await g.click("[data-onglet=codes]");
  await g.click("[data-type=semaine]");
  await g.fill("#note", "Marie 677 12 34 56");
  await g.click("#creer");
  await g.waitForSelector(".code-cree b");
  const codeSemaine = (await g.textContent(".code-cree b")).trim();
  assert.match(codeSemaine, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  const lienWa = await g.getAttribute(".code-cree a", "href");
  assert.ok(lienWa.startsWith("https://wa.me/237677123456?text="), lienWa);
  const msg = decodeURIComponent(lienWa.split("text=")[1]);
  assert.match(msg, /Bonjour Marie, voici votre code de lecture APEL Éditions/);
  assert.ok(msg.includes("?code=" + codeSemaine + "#/lire"), msg);
  assert.match(msg, /1 semaine/);
  await g.click("[data-type=jour]");
  await g.fill("#note", "");
  await g.fill("#nombre", "2");
  await g.click("#creer");
  await g.waitForSelector("text=2 codes créés");
  const codesJour = await g.$$eval(".code-cree b", l => l.map(x => x.textContent.trim()));
  assert.equal(codesJour.length, 2);
  await g.fill("#promo-mot", "bienvenue");
  await g.fill("#promo-jours", "3");
  await g.fill("#promo-max", "1");
  await g.click("#creer-promo");
  await g.waitForSelector(".code-cree >> text=BIENVENUE");
  assert.equal(await g.locator(".liste li").count(), 4);

  log("Tarifs");
  await g.click("[data-onglet=reglages]");
  await g.fill("#prix-semaine", "1 000 FCFA");
  await g.fill("#accueil", "Nouveau : Souhaits maudits, chapitre par chapitre !");
  await g.click("#enregistrer-reglages");
  await g.waitForSelector("text=Tarifs enregistrés");

  /* ---------- Lecteur ---------- */
  log("Lecteur : le Salon apparaît sur l'accueil");
  await lecteur.goto(s.url + "/");
  await lecteur.waitForSelector(".salon-accueil");
  await pasDeDefilement(lecteur, "accueil");
  await lecteur.click(".salon-accueil >> text=Entrer dans le Salon");
  await lecteur.waitForSelector("text=Nouveau : Souhaits maudits, chapitre par chapitre !");
  await lecteur.waitForSelector(".sl-livre >> text=premier chapitre offert");
  await pasDeDefilement(lecteur, "Salon");

  log("Fiche du livre de la bibliothèque : bouton Lire en ligne");
  await lecteur.goto(s.url + "/#/livre/souhaits-maudits");
  await lecteur.waitForSelector("text=Lire en ligne");
  await lecteur.click("text=Lire en ligne");
  await lecteur.waitForSelector(".sl-sommaire");
  assert.equal(await lecteur.locator(".sl-sommaire a.ferme").count(), 2, "chapitres 2 et 3 verrouillés");
  assert.equal(await lecteur.locator(".sl-sommaire >> text=Chapitre 3 : Les ombres de la nuit").count(), 1);
  await pasDeDefilement(lecteur, "livre du Salon");

  log("Chapitre offert : texte, mise en forme, fin du chapitre, badge");
  await lecteur.click("text=Commencer la lecture");
  await lecteur.waitForSelector(".sl-texte");
  assert.equal(await lecteur.locator(".barre").isVisible(), false, "barre du bas cachée pendant la lecture");
  assert.equal(await lecteur.locator(".sl-texte strong").first().textContent(), "jeune femme");
  assert.equal(await lecteur.locator(".sl-texte em").first().textContent(), "rêvait");
  assert.equal(await lecteur.locator(".sl-sep").count(), 1);
  assert.equal(await lecteur.locator(".sl-texte p.sl-q").count(), 1);
  await pasDeDefilement(lecteur, "liseuse");
  await lecteur.locator("#sl-fin").scrollIntoViewIfNeeded();
  await lecteur.waitForSelector("text=Nouveau badge : 📖 Premier chapitre");

  log("Réaction");
  await lecteur.waitForSelector("#sl-emojis button");
  await lecteur.click("#sl-emojis [data-val=feu]");
  await lecteur.waitForSelector("#sl-emojis [data-val=feu][aria-pressed=true] >> text=1");

  log("Réglages de la liseuse");
  await lecteur.click("[data-sl=plus]");
  await lecteur.click("[data-sl=theme][data-val=sepia]");
  assert.match(await lecteur.getAttribute(".liseuse", "class"), /sl-th-sepia/);
  assert.equal(await lecteur.evaluate(() => JSON.parse(localStorage.getItem("apel-liseuse")).taille), 20);

  log("Carte-citation");
  await lecteur.click(".sl-texte p[data-para='1']");
  await lecteur.click("#sl-citer");
  await lecteur.waitForSelector(".sl-apercu");
  const taille = await lecteur.evaluate(() => { const i = document.querySelector(".sl-apercu"); return i.naturalWidth + "x" + i.naturalHeight; });
  assert.equal(taille, "1080x1350");
  assert.ok((await lecteur.getAttribute("a[download]", "href")).startsWith("data:image/png"));
  await lecteur.click(".feuille [data-fermer]");

  log("Chapitre suivant verrouillé, demande de code sur WhatsApp");
  await lecteur.goto(s.url + "/#/lire/souhaits-maudits/2");
  await lecteur.waitForSelector("text=La suite vous attend");
  await lecteur.click(".sl-suite [data-sl=debloquer]");
  await lecteur.waitForSelector(".sl-formule");
  const formule = await lecteur.getAttribute(".sl-formule:nth-child(2)", "href");
  assert.ok(formule.startsWith("https://wa.me/237693779364?text="), formule);
  assert.match(decodeURIComponent(formule), /formule 1 semaine \(1 000 FCFA\)/);
  await lecteur.fill("#sl-code", "FAUX-CODE");
  await lecteur.click(".sl-code button[type=submit]");
  await lecteur.waitForSelector("text=Ce code n'existe pas");
  await lecteur.fill("#sl-code", codeSemaine.toLowerCase().replace("-", " "));
  await lecteur.click(".sl-code button[type=submit]");
  await lecteur.waitForSelector("text=Bienvenue au Salon");
  await lecteur.waitForSelector(".sl-texte >> text=Un inconnu frappa à la porte.");

  log("Lien du code ouvert sur un 2e appareil, puis refus sur un 3e");
  const ctx2 = await contexte({ largeur: 320 }); const l2 = await page(ctx2);
  await l2.goto(s.url + "/?code=" + codeSemaine);
  await l2.waitForSelector("text=Bienvenue au Salon");
  await l2.waitForSelector(".sl-pass >> text=1 semaine");
  await pasDeDefilement(l2, "Salon à 320 px");
  const ctx3 = await contexte(); const l3 = await page(ctx3);
  await l3.goto(s.url + "/?code=" + codeSemaine);
  await l3.waitForSelector("text=déjà utilisé sur 2 appareils");

  log("Code promo limité à 1 lecteur");
  await l3.fill("#sl-code", "Bienvenue");
  await l3.click(".sl-code button[type=submit]");
  await l3.waitForSelector("text=Bienvenue au Salon");
  await l3.waitForSelector(".sl-pass >> text=Code promo");
  const ctx4 = await contexte(); const l4 = await page(ctx4);
  await l4.goto(s.url + "/#/lire");
  await l4.waitForSelector("[data-sl=code]");
  await l4.click("[data-sl=code]");
  await l4.fill("#sl-code", "BIENVENUE");
  await l4.click(".sl-code button[type=submit]");
  await l4.waitForSelector("text=nombre maximum de lecteurs");

  log("Révocation : la lecture s'arrête tout de suite");
  await g.reload();
  await g.waitForSelector("text=Tous les codes");
  assert.match(await g.textContent(".chiffres"), /3\s*appareils avec un code actif/);
  const ligne = g.locator(".liste li", { hasText: codeSemaine });
  await ligne.locator("[data-revoquer]").click();
  await ligne.locator("text=Confirmer").click();
  await g.waitForSelector("text=Code révoqué");
  await l2.goto(s.url + "/#/lire/souhaits-maudits/3");
  await l2.waitForSelector("text=Votre code de lecture a expiré");
  await l2.waitForSelector("text=La suite vous attend");

  log("Feuilleton : chapitre ajouté à la suite, signalé « Nouveau »");
  await g.click("[data-onglet=livres]");
  await g.click("[data-livre='souhaits-maudits']");
  await g.click("[data-mode=ajouter]");
  await g.setInputFiles("#ed-fichier", fichierSuite);
  await g.waitForSelector("text=1 chapitre trouvé");
  await g.fill("#ed-gratuits", "2");
  await g.click("#ed-publier");
  await g.waitForSelector("text=Publié : 4 chapitres en ligne");
  const cat = (await api("lecture?action=catalogue")).d;
  assert.deepEqual(cat.livres[0].chapitres.map(c => c.titre), ["Chapitre 1 : La promesse", "Chapitre 2 : Le pacte", "Chapitre 3 : Les ombres de la nuit", "Chapitre 4 : Le retour"]);
  assert.equal(cat.livres[0].gratuits, 2);
  assert.equal((await api("lecture?action=chapitre&livre=souhaits-maudits&n=2")).statut, 200, "chapitre 2 désormais offert");
  assert.equal((await api("lecture?action=chapitre&livre=souhaits-maudits&n=3")).statut, 402);

  log("Gérants : invitation, connexion d'un gérant sans droit d'inviter, retrait");
  await g.click("[data-onglet=gerants]");
  await g.fill("#invite", "aide.apel@gmail.com");
  await g.click("#inviter");
  await g.waitForSelector(".liste >> text=aide.apel@gmail.com");
  const c = await api("gerant", { action: "connexion", credential: "test:aide.apel@gmail.com" });
  assert.equal(c.statut, 200);
  assert.equal(c.d.proprietaire, false);
  assert.equal((await api("gerant", { action: "inviter", email: "x.y@gmail.com" }, c.d.jeton)).statut, 403);
  assert.equal((await api("gerant", { action: "codes", type: "mois", nombre: 1 }, c.d.jeton)).statut, 200, "le gérant crée des codes");
  await g.click("[data-retirer='aide.apel@gmail.com']");
  await g.click("text=Confirmer");
  await g.waitForSelector("text=Gérant retiré");
  assert.equal((await api("gerant?action=tableau", null, c.d.jeton)).statut, 403, "un gérant retiré perd l'accès");

  log("Pass gérant : lecture de tous les chapitres");
  await g.click("#pass");
  await g.waitForSelector("text=Pass gérant actif");
  const pg = await page(ctxG);
  await pg.goto(s.url + "/#/lire/souhaits-maudits/3");
  await pg.waitForSelector(".sl-texte >> text=Rien ne fut plus jamais comme avant.");

  log("Sécurité de l'API");
  assert.equal((await api("gerant?action=tableau")).statut, 401);
  assert.equal((await api("lecture", { action: "activer", code: codeSemaine, appareil: "court" })).statut, 400);
  assert.equal((await api("lecture?action=chapitre&livre=souhaits-maudits&n=3", null, "faux.jeton")).statut, 402);
  assert.equal((await api("lecture", { action: "reagir", livre: "souhaits-maudits", n: 1, emoji: "<script>", appareil: "abcdefghijklmnop1234" })).statut, 400);

  log("Version anglaise");
  await lecteur.goto(s.url + "/?lang=en#/lire");
  await lecteur.waitForSelector("text=The Reading Lounge");
  await lecteur.waitForSelector("text=My reading log");

  assert.deepEqual(erreurs, [], "erreurs JavaScript");
  console.log("\nSalon de lecture : tout est bon.");
} catch (e) {
  console.error("\nÉchec à l'étape « " + etape + " »");
  if (erreurs.length) console.error("Erreurs de la page :\n" + erreurs.join("\n"));
  throw e;
} finally {
  await navigateur.close();
  await s.arreter();
  fs.rmSync(TMP, { recursive: true, force: true });
}
