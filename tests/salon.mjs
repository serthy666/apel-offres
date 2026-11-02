// Parcours complet du Salon de lecture (Playwright) : node tests/salon.mjs
// Gérant : connexion Google, import d'un fichier Word, publication, codes 24 h / semaine / mois / promo, révocation, gérants.
// Lecteur : Salon vide puis rempli, chapitre offert, verrou, demande de code sur WhatsApp, activation (champ et lien),
// limite de 2 appareils, promo limitée, réactions, carnet et badges, carte-citation, passage favori, marque-page,
// réglages de la liseuse (thème, taille), mode lecture, Ma liseuse, reprise, lecture sans réseau, flèches du clavier,
// vidéos (lien et fichier téléversé, lecture par morceaux), barre d'onglets, logo de l'accueil.
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
const FAUX_GIS = `window.google={accounts:{oauth2:{initTokenClient:function(o){return {requestAccessToken:function(){setTimeout(function(){o.callback({access_token:"jeton-drive",expires_in:3600})},10)}}}},id:{initialize:function(o){window.__cb=o.callback},
  renderButton:function(el){el.innerHTML='<button id="faux-google">Se connecter avec Google</button>'},
  disableAutoSelect:function(){}}}};window.__google=function(m){window.__cb({credential:"test:"+m})};`;

const LIVRE = [
  { style: "Title", runs: [["Souhaits maudits", ""]] },
  { centre: true, runs: [["À ma mère.", "i"]] },
  { style: "Heading1", runs: [["Chapitre 1 : La promesse", ""]] },
  { runs: [["Il était une fois une ", ""], ["jeune femme", "b"], [" pleine de vie qui ", ""], ["rêvait", "i"], [" de Douala.", ""]] },
  "Elle marchait chaque matin jusqu'au marché, le cœur léger, sans savoir ce qui l'attendait.",
  ...Array.from({ length: 14 }, (_, i) => "Le marché de Mokolo bruissait de mille voix, et Amina avançait entre les étals de mangues, de pagnes et d'épices, saluant chaque vendeuse par son prénom. Paragraphe " + (i + 1) + "."),
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

// Faux Google Drive : sélecteur qui « choisit » deux fichiers, et téléchargements servis par le test
const FAUX_PICKER = `window.gapi={load:function(n,cb){cb()}};window.google=window.google||{};
google.picker={ViewId:{DOCS:"docs"},Feature:{MULTISELECT_ENABLED:"multi"},Action:{PICKED:"picked",CANCEL:"cancel"},
  DocsView:function(){var v=this;["setMimeTypes","setIncludeFolders","setSelectFolderEnabled"].forEach(function(k){v[k]=function(){return v}})},
  PickerBuilder:function(){var b=this,cb;["addView","enableFeature","setOAuthToken","setDeveloperKey","setAppId","setLocale","setTitle"].forEach(function(k){b[k]=function(){return b}});
    b.setCallback=function(f){cb=f;return b};b.build=function(){return {setVisible:function(){setTimeout(function(){cb({action:"picked",docs:[
      {id:"doc2",name:"Chapitre 2 - Le Seuil",mimeType:"application/vnd.google-apps.document"},
      {id:"txt1",name:"Chapitre 1 - L'Empire.txt",mimeType:"text/plain"}]})},20)}}}}};`;
const s = await demarrer({ env: { GOOGLE_API_KEY: "cle-test", GOOGLE_PROJET: "123456" } });
const navigateur = await chromium.launch();
const erreurs = [];
let etape = "";
function log(t) { etape = t; console.log("• " + t); }

async function contexte(opts = {}) {
  const ctx = await navigateur.newContext({ viewport: { width: opts.largeur || 390, height: 800 }, locale: "fr-FR", serviceWorkers: "block", ...opts.ctx });
  await ctx.route(/docs\.google\.com/, r => r.abort());
  await ctx.route(/googleusercontent|drive\.google/, r => r.abort());
  await ctx.route("https://accounts.google.com/gsi/client", r => r.fulfill({ contentType: "text/javascript", body: FAUX_GIS }));
  await ctx.route("https://apis.google.com/js/api.js", r => r.fulfill({ contentType: "text/javascript", body: FAUX_PICKER }));
  await ctx.route(/googleapis\.com\/drive\/v3\/files\//, r => {
    const u = r.request().url();
    if (r.request().headers().authorization !== "Bearer jeton-drive") return r.fulfill({ status: 401, body: "" });
    if (u.includes("/doc2/export")) return r.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", body: fabriquerDocx([{ style: "Title", runs: [["Le Masque d'ébène", ""]] }, { style: "Heading1", runs: [["Chapitre 2 : Le Seuil", ""]] }, "Gaétan franchit le seuil de la villa."]) });
    if (u.includes("/txt1?alt=media")) return r.fulfill({ contentType: "text/plain", body: "Les gyrophares bleus tournoyaient sur les façades.\n\nMargareth Petit venait d'apparaître." });
    return r.fulfill({ status: 404, body: "" });
  });
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
  await g.selectOption("#ed-genre", "roman");
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

  log("Vidéos : lien YouTube et fichier du téléphone");
  await g.click("[data-onglet=videos]");
  await g.click("[data-source=lien]");
  await g.fill("#vi-titre", "Robyn Tyo’o présente Souhaits maudits");
  await g.selectOption("#vi-livre", "souhaits-maudits");
  await g.fill("#vi-lien", "https://www.youtube.com/shorts/dQw4w9WgXcQ");
  await g.click("#vi-publier");
  await g.waitForSelector(".liste >> text=Robyn Tyo’o présente Souhaits maudits");
  await g.click("[data-source=lien]");
  await g.fill("#vi-titre", "Lien inconnu");
  await g.fill("#vi-lien", "https://exemple.com/video");
  await g.click("#vi-publier");
  await g.waitForSelector("text=Lien non reconnu");
  await g.click("[data-source=fichier]");
  await g.fill("#vi-titre", "Coulisses de la dédicace");
  const fausseVideo = path.join(TMP, "dedicace.mp4"); fs.writeFileSync(fausseVideo, Buffer.alloc(200000, 7));
  await g.setInputFiles("#vi-fichier", fausseVideo);
  await g.click("#vi-publier");
  await g.waitForSelector(".liste >> text=Coulisses de la dédicace", { timeout: 20000 });
  const cleVideo = [...s.env.MEDIAS.objets.keys()].find(k => k.startsWith("videos/"));
  assert.ok(cleVideo, "vidéo rangée dans le stockage");
  const morceau = await fetch(s.url + "/api/lecture?action=media&cle=" + cleVideo, { headers: { range: "bytes=100-199" } });
  assert.equal(morceau.status, 206);
  assert.equal(morceau.headers.get("content-range"), "bytes 100-199/200000");
  assert.equal((await morceau.arrayBuffer()).byteLength, 100);

  log("Tarifs");
  await g.click("[data-onglet=reglages]");
  await g.fill("#prix-semaine", "1 000 FCFA");
  await g.fill("#accueil", "Nouveau : Souhaits maudits, chapitre par chapitre !");
  await g.click("#enregistrer-reglages");
  await g.waitForSelector("text=Tarifs enregistrés");

  /* ---------- Lecteur ---------- */
  log("Lecteur : logo, univers, barre d'onglets, Salon sur l'accueil");
  await lecteur.goto(s.url + "/");
  await lecteur.waitForSelector(".salon-accueil");
  assert.equal(await lecteur.locator(".medaillon img[src='assets/logo-plume.webp']").count(), 1, "logo APEL dans l'accueil");
  assert.equal(await lecteur.locator(".raccourcis .tuile").count(), 4);
  for (const k of ["profils", "liens"]) assert.ok(await lecteur.locator("." + k).count() > 0, "service " + k + " toujours là");
  assert.equal(await lecteur.getAttribute(".onglet[data-onglet=accueil]", "aria-current"), "page");
  await lecteur.click(".onglet[data-onglet=offres]");
  await lecteur.waitForSelector("h1 >> text=Toutes nos offres");
  assert.equal(await lecteur.getAttribute(".onglet[data-onglet=offres]", "aria-current"), "page");
  await lecteur.goBack();
  await lecteur.waitForSelector(".salon-accueil");
  await pasDeDefilement(lecteur, "accueil");
  await lecteur.click(".salon-accueil >> text=Entrer dans le Salon");
  await lecteur.waitForSelector("text=Nouveau : Souhaits maudits, chapitre par chapitre !");
  await lecteur.waitForSelector(".sl-livre >> text=premier chapitre offert");
  await lecteur.waitForSelector(".sl-livre >> text=Romans");
  assert.equal(await lecteur.getAttribute(".onglet[data-onglet=lire]", "aria-current"), "page");
  await pasDeDefilement(lecteur, "Salon");
  assert.equal(await lecteur.locator(".sl-video").count(), 2, "deux vidéos dans le Salon");
  await lecteur.click(".sl-video >> text=Robyn Tyo’o présente");
  await lecteur.waitForSelector(".sl-ecran iframe[src^='https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ']");
  await lecteur.click(".voile [data-fermer]");
  await lecteur.waitForSelector(".voile", { state: "detached" });
  await lecteur.click(".sl-video >> text=Coulisses");
  await lecteur.waitForSelector(".sl-ecran video[src*='action=media']");
  await lecteur.keyboard.press("Escape");
  await lecteur.waitForSelector(".voile", { state: "detached" });

  log("Fiche du livre de la bibliothèque : bouton Lire en ligne");
  await lecteur.goto(s.url + "/#/livre/souhaits-maudits");
  await lecteur.waitForSelector("text=Lire en ligne");
  await lecteur.click("text=Lire en ligne");
  await lecteur.waitForSelector(".sl-sommaire");
  assert.equal(await lecteur.locator(".sl-sommaire a.ferme").count(), 2, "chapitres 2 et 3 verrouillés");
  assert.equal(await lecteur.locator(".sl-sommaire >> text=Chapitre 3 : Les ombres de la nuit").count(), 1);
  assert.equal(await lecteur.locator(".sl-video").count(), 1, "bande-annonce sur la page du livre");
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

  log("Réglages de la liseuse : thème sombre, taille, police ; mode lecture ; marque-page");
  await lecteur.click("[data-sl=reglages]");
  await lecteur.waitForSelector(".feuille .sl-themes");
  const tailleAvant = await lecteur.evaluate(() => JSON.parse(localStorage.getItem("apel-liseuse") || "{}").taille || 19);
  await lecteur.click(".feuille [data-sl=plus]");
  await lecteur.click(".feuille [data-pref=theme][data-val=sombre]");
  await lecteur.click(".feuille [data-pref=police][data-val=lisible]");
  assert.match(await lecteur.getAttribute(".liseuse", "class"), /sl-th-sombre/);
  assert.match(await lecteur.getAttribute(".liseuse", "class"), /sl-po-lisible/);
  assert.equal(await lecteur.evaluate(() => document.documentElement.dataset.liseuse), "sombre", "toute la page passe en sombre");
  assert.equal(await lecteur.evaluate(() => JSON.parse(localStorage.getItem("apel-liseuse")).taille), tailleAvant + 1);
  await lecteur.click(".feuille [data-pref=theme][data-val=sepia]");
  await lecteur.click(".feuille [data-fermer]");
  await lecteur.waitForSelector(".voile", { state: "detached" });
  assert.match(await lecteur.getAttribute(".liseuse", "class"), /sl-th-sepia/);
  await lecteur.click(".sl-outils [data-sl=immersif]");
  assert.ok(await lecteur.evaluate(() => document.body.classList.contains("immersif")), "mode lecture");
  await lecteur.waitForSelector("#sl-quitter >> text=Quitter le mode lecture");
  await lecteur.click("#sl-quitter");
  assert.ok(!(await lecteur.evaluate(() => document.body.classList.contains("immersif"))));
  await lecteur.evaluate(() => { const t = document.querySelector(".sl-texte"); window.scrollTo(0, t.offsetTop + t.offsetHeight / 2); });
  await lecteur.waitForTimeout(300);
  await lecteur.click(".sl-outils [data-sl=marque]");
  await lecteur.waitForSelector("text=Marque-page posé");

  log("Carte-citation");
  await lecteur.click(".sl-texte p[data-para='1']");
  await lecteur.click("#sl-citer");
  await lecteur.waitForSelector(".sl-apercu");
  const taille = await lecteur.evaluate(() => { const i = document.querySelector(".sl-apercu"); return i.naturalWidth + "x" + i.naturalHeight; });
  assert.equal(taille, "1080x1350");
  assert.ok((await lecteur.getAttribute("a[download]", "href")).startsWith("data:image/png"));
  await lecteur.click(".feuille [data-sl=garder]");
  await lecteur.waitForSelector("text=Passage gardé dans Ma liseuse");
  await lecteur.click(".feuille [data-fermer]");
  await lecteur.waitForSelector(".voile", { state: "detached" });

  log("Ma liseuse : lecture en cours, marque-page, passage favori, réglages");
  await lecteur.goto(s.url + "/#/liseuse");
  await lecteur.waitForSelector("h1 >> text=Ma liseuse");
  await lecteur.waitForSelector(".sl-reprise >> text=Souhaits maudits");
  await lecteur.waitForSelector(".sl-notes >> text=Chapitre 1");
  await lecteur.waitForSelector(".sl-favoris blockquote");
  assert.equal(await lecteur.getAttribute(".sl-themes [data-val=sepia]", "aria-pressed"), "true");
  await pasDeDefilement(lecteur, "Ma liseuse");
  await lecteur.click(".sl-notes a");
  await lecteur.waitForSelector(".sl-texte");
  await lecteur.waitForSelector("text=Reprise là où vous vous étiez arrêté");
  await lecteur.waitForFunction(() => window.scrollY > 300, null, { timeout: 5000 });

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

  log("Lecture sans réseau d'un chapitre déjà ouvert");
  await ctxL.setOffline(true);
  await lecteur.goto(s.url + "/#/lire/souhaits-maudits/1").catch(() => {});
  await lecteur.evaluate(() => { location.hash = "#/lire/souhaits-maudits"; });
  await lecteur.evaluate(() => { location.hash = "#/lire/souhaits-maudits/2"; });
  await lecteur.waitForSelector(".sl-texte >> text=Un inconnu frappa à la porte.");
  await ctxL.setOffline(false);

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

  log("Équipe : administrateurs et gérants");
  await g.click("[data-onglet=gerants]");
  await g.waitForSelector(".liste >> text=Propriétaire");
  await g.fill("#invite", "Directrice@APEL-editions.cm");
  await g.click("[data-nouveau-role=admin]");
  await g.click("#inviter");
  await g.waitForSelector(".liste >> text=directrice@apel-editions.cm");
  await g.fill("#invite", "pas-une-adresse");
  await g.click("#inviter");
  await g.waitForSelector("text=Entrez une adresse e-mail complète");
  const adm = await api("gerant", { action: "connexion", credential: "test:directrice@apel-editions.cm" });
  assert.equal(adm.statut, 200);
  assert.equal(adm.d.role, "admin");
  assert.equal((await api("gerant", { action: "inviter", email: "aide.apel@gmail.com", role: "gerant" }, adm.d.jeton)).statut, 200, "un administrateur ajoute un gérant");
  const c = await api("gerant", { action: "connexion", credential: "test:aide.apel@gmail.com" });
  assert.equal(c.d.role, "gerant");
  assert.equal((await api("gerant", { action: "inviter", email: "x.y@gmail.com" }, c.d.jeton)).statut, 403, "un gérant n'ajoute personne");
  assert.equal((await api("gerant", { action: "codes", type: "mois", nombre: 1 }, c.d.jeton)).statut, 200, "le gérant crée des codes");
  assert.equal((await api("gerant", { action: "retirer", email: "directrice@apel-editions.cm" }, adm.d.jeton)).statut, 400, "pas de retrait de soi-même");
  assert.equal((await api("gerant", { action: "role", email: "aide.apel@gmail.com", role: "admin" }, adm.d.jeton)).statut, 200);
  assert.equal((await api("gerant", { action: "inviter", email: "x.y@gmail.com" }, c.d.jeton)).statut, 200, "devenu administrateur, il peut ajouter");
  await g.reload();
  await g.click("[data-onglet=gerants]");
  await g.selectOption("[data-role-de='aide.apel@gmail.com']", "gerant");
  await g.waitForSelector("text=Rôle changé : gérant");
  await g.click("[data-retirer='aide.apel@gmail.com']");
  await g.click("text=Confirmer");
  await g.waitForSelector("text=Membre retiré de l’équipe");
  assert.equal((await api("gerant?action=tableau", null, c.d.jeton)).statut, 403, "un membre retiré perd l'accès");
  const adminsSecours = await demarrer({ env: { ADMINISTRATEURS: "secours@gmail.com" } });
  const sec = await (await fetch(adminsSecours.url + "/api/gerant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "connexion", credential: "test:secours@gmail.com" }) })).json();
  assert.equal(sec.role, "admin", "administrateur de secours (réglage Cloudflare)");
  await adminsSecours.arreter();

  log("Import de plusieurs fichiers d'un coup (un fichier = un chapitre), puis depuis Google Drive");
  await g.click("[data-onglet=livres]");
  await g.click("text=Ajouter un livre");
  await g.selectOption("#ed-cat", "autre");
  await g.fill("#ed-titre", "Le Masque d'ébène");
  const f1 = path.join(TMP, "Chapitre 2 - Le Seuil.docx"), f2 = path.join(TMP, "Chapitre 1 - L'Empire.docx"), f3 = path.join(TMP, "Chapitre 10 - La Chute.docx");
  fs.writeFileSync(f1, fabriquerDocx([{ style: "Title", runs: [["LE MASQUE", ""]] }, { style: "Heading1", runs: [["Chapitre 2 : Le Seuil", ""]] }, { style: "Heading2", runs: [["YAOUNDÉ, 21H45.", ""]] }, "Gaétan franchit le seuil."]));
  fs.writeFileSync(f2, fabriquerDocx([{ runs: [["ACTE I", "b"]] }, "Les gyrophares bleus tournoyaient."]));
  fs.writeFileSync(f3, fabriquerDocx(["Tout s'effondra."]));
  await g.setInputFiles("#ed-fichier", [f1, f2, f3]);
  await g.waitForSelector("text=3 chapitres trouvés dans « 3 fichiers »");
  assert.deepEqual(await g.$$eval("[data-titre]", l => l.map(x => x.value)), ["Chapitre 1 - L'Empire", "Chapitre 2 - Le Seuil", "Chapitre 10 - La Chute"]);
  await g.click("[data-apercu='1']");
  const ap = await g.textContent(".apercu");
  assert.ok(ap.includes("YAOUNDÉ, 21H45.") && ap.includes("Gaétan franchit") && !ap.includes("LE MASQUE") && !ap.includes("Chapitre 2 : Le Seuil"), ap);
  await g.click("#ed-drive");
  await g.waitForSelector("text=2 chapitres trouvés dans « 2 fichiers de Google Drive »");
  assert.deepEqual(await g.$$eval("[data-titre]", l => l.map(x => x.value)), ["Chapitre 1 - L'Empire", "Chapitre 2 - Le Seuil"]);
  await g.click("#ed-publier");
  await g.waitForSelector("text=Publié : 2 chapitres en ligne");
  const ch1 = (await api("lecture?action=chapitre&livre=le-masque-d-ebene&n=1")).d;
  assert.equal(ch1.titre, "Chapitre 1 - L'Empire");
  assert.equal(ch1.blocs[0].r[0][0], "Les gyrophares bleus tournoyaient sur les façades.");

  log("Pass gérant : lecture de tous les chapitres, flèches du clavier");
  await g.click("#pass");
  await g.waitForSelector("text=Pass gérant actif");
  const pg = await page(ctxG);
  await pg.goto(s.url + "/#/lire/souhaits-maudits/3");
  await pg.waitForSelector(".sl-texte >> text=Rien ne fut plus jamais comme avant.");
  await pg.keyboard.press("ArrowRight");
  await pg.waitForSelector(".sl-texte >> text=Elle revint au village");
  assert.ok(pg.url().endsWith("#/lire/souhaits-maudits/4"));

  log("Sécurité de l'API");
  assert.equal((await api("gerant?action=tableau")).statut, 401);
  assert.equal((await api("lecture", { action: "activer", code: codeSemaine, appareil: "court" })).statut, 400);
  assert.equal((await api("lecture?action=chapitre&livre=souhaits-maudits&n=3", null, "faux.jeton")).statut, 402);
  assert.equal((await api("lecture", { action: "reagir", livre: "souhaits-maudits", n: 1, emoji: "<script>", appareil: "abcdefghijklmnop1234" })).statut, 400);

  log("Version anglaise");
  await lecteur.goto(s.url + "/?lang=en#/lire");
  await lecteur.waitForSelector("text=The Reading Lounge");
  await lecteur.click(".sl-bascule >> text=My reader");
  await lecteur.waitForSelector("text=My reading log");
  assert.equal(await lecteur.textContent(".onglet[data-onglet=lire] span"), "Read");

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
