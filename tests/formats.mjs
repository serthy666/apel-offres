// Lecture des formats de texte acceptés par l'Espace gérant (textes.js) : node tests/formats.mjs
// Le même livre est écrit en .docx, puis LibreOffice (soffice) le convertit en .odt, .rtf, .html, .epub et .pdf ;
// .txt et .md sont écrits à la main. Chaque fichier doit donner les mêmes chapitres.
// Sans LibreOffice installé, seuls .docx, .txt, .md et le texte collé sont vérifiés.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { demarrer } from "./serveur.mjs";
import { fabriquerDocx } from "./docx.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "formats-"));
const TEXTE = "Elle marchait chaque matin jusqu'au marché de Mokolo, le cœur léger, sans savoir ce qui l'attendait ce jour-là. ".repeat(4).trim();
const LIVRE = [
  { style: "Title", runs: [["Souhaits maudits", ""]] },
  { style: "Heading1", runs: [["Chapitre 1 : La promesse", ""]] },
  { runs: [["Il était une fois une ", ""], ["jeune femme", "b"], [" qui ", ""], ["rêvait", "i"], [" de Douala.", ""]] },
  TEXTE,
  { centre: true, runs: [["* * *", ""]] },
  "La nuit tomba sur Bonabéri. " + TEXTE,
  { style: "Heading1", runs: [["Chapitre 2 : Le pacte", ""]] },
  "Un inconnu frappa à la porte. " + TEXTE,
  { style: "Heading1", runs: [["Chapitre 3 : Les ombres", ""]] },
  "Rien ne fut plus jamais comme avant. " + TEXTE
];
const ATTENDU = ["Chapitre 1 : La promesse", "Chapitre 2 : Le pacte", "Chapitre 3 : Les ombres"];

const fichiers = {};
fichiers.docx = path.join(TMP, "livre.docx"); fs.writeFileSync(fichiers.docx, fabriquerDocx(LIVRE));
fichiers.txt = path.join(TMP, "livre.txt");
fs.writeFileSync(fichiers.txt, "Chapitre 1 : La promesse\n\nIl était une fois une jeune femme qui rêvait de Douala.\n\n" + TEXTE + "\n\n***\n\nLa nuit tomba.\n\nChapitre 2 : Le pacte\n\nUn inconnu frappa à la porte.\n\nChapitre 3 : Les ombres\n\nRien ne fut plus jamais comme avant.\n\nLes ombres dansaient\nsur les murs de la case\net le vent chantait\n");
fichiers.md = path.join(TMP, "livre.md");
fs.writeFileSync(fichiers.md, "# Chapitre 1 : La promesse\n\nIl était une fois une **jeune femme** qui *rêvait* de Douala.\n\n> Méfie-toi de ce que tu souhaites.\n\n# Chapitre 2 : Le pacte\n\nUn inconnu frappa.\n\n# Chapitre 3 : Les ombres\n\nRien ne fut plus jamais comme avant.\n");
let soffice = true;
try { execFileSync("soffice", ["--version"], { stdio: "ignore" }); } catch (e) { soffice = false; }
if (soffice) {
  for (const [ext, filtre] of [["odt", "odt"], ["rtf", "rtf"], ["html", "html:XHTML Writer File:UTF8"], ["epub", "epub"], ["pdf", "pdf"]]) {
    try {
      execFileSync("soffice", ["--headless", "--convert-to", filtre, "--outdir", TMP, fichiers.docx], { stdio: "ignore", timeout: 120000 });
      const f = path.join(TMP, "livre." + ext);
      if (fs.existsSync(f)) fichiers[ext] = f; else console.log("(conversion " + ext + " impossible ici)");
    } catch (e) { console.log("(conversion " + ext + " impossible ici)"); }
  }
} else console.log("(LibreOffice absent : formats convertis non vérifiés)");

const s = await demarrer();
const navigateur = await chromium.launch();
const p = await navigateur.newPage();
const erreurs = []; p.on("pageerror", e => erreurs.push(e.message));
await p.route("https://accounts.google.com/gsi/client", r => r.fulfill({ contentType: "text/javascript", body: "window.google={accounts:{id:{initialize:function(){},renderButton:function(){},disableAutoSelect:function(){}}}};" }));
await p.goto(s.url + "/gerant.html");
await p.waitForFunction(() => window.APEL_TEXTES);
try {
  for (const [ext, f] of Object.entries(fichiers)) {
    await p.evaluate(() => { const i = document.createElement("input"); i.type = "file"; i.id = "essai"; document.body.appendChild(i); });
    await p.setInputFiles("#essai", f);
    const r = await p.evaluate(() => APEL_TEXTES.lire(document.getElementById("essai").files[0]).then(x => ({ titre: x.titre, chapitres: x.chapitres.filter(c => !c.avant).map(c => ({ titre: c.titre, blocs: c.blocs, mots: c.mots })) }), e => ({ erreur: e.message })));
    await p.evaluate(() => document.getElementById("essai").remove());
    assert.ok(!r.erreur, ext + " : " + r.erreur);
    assert.deepEqual(r.chapitres.map(c => c.titre), ATTENDU, ext + " : chapitres");
    assert.ok(r.chapitres.every(c => c.mots > 0), ext + " : chapitres vides");
    const ch1 = JSON.stringify(r.chapitres[0].blocs);
    if (["docx", "odt", "rtf", "html", "epub", "md"].includes(ext)) {
      assert.ok(ch1.includes('["jeune femme",1]'), ext + " : gras perdu " + ch1.slice(0, 300));
      assert.ok(ch1.includes('["rêvait",2]'), ext + " : italique perdu");
    }
    if (["docx", "odt", "rtf", "html", "epub", "txt"].includes(ext)) assert.ok(r.chapitres[0].blocs.some(b => b.s === "sep"), ext + " : séparateur perdu");
    if (ext === "md") assert.ok(r.chapitres[0].blocs.some(b => b.s === "q"), "md : citation perdue");
    if (ext === "txt") assert.ok(JSON.stringify(r.chapitres[2].blocs).includes("dansaient\\nsur les murs"), "txt : vers du poème perdus");
    console.log("• " + ext.padEnd(5) + " " + r.chapitres.length + " chapitres" + (r.titre ? " · titre « " + r.titre + " »" : ""));
  }
  const colle = await p.evaluate(() => APEL_TEXTES.lireColle("Chapitre 1\n\nBonjour **Douala**.\n\nChapitre 2\n\nAu revoir."));
  assert.deepEqual(colle.chapitres.map(c => c.titre), ["Chapitre 1", "Chapitre 2"]);
  console.log("• texte collé");
  const faux = await p.evaluate(() => APEL_TEXTES.lireColle("Chapitre 1\n\nIl marchait.\n\npartie des sorts et on n'entend plus rien.\n\nLa nuit tomba.\n\nScène étrange. Une lueur blanche.\n\nLe hibou cria.\n\nPartie de chasse au village.\n\nTout le monde courut.\n\nChapitre un peu long à lire.\n\nIl dormit.\n\nCHAPITRE II\n\nFin."));
  assert.deepEqual(faux.chapitres.map(c => c.titre), ["Chapitre 1", "CHAPITRE II"], "faux titres : " + JSON.stringify(faux.chapitres.map(c => c.titre)));
  const titres = await p.evaluate(() => ["Chapitre premier", "Partie deux : le retour", "Acte II", "Prologue", "Épilogue : le retour", "partie des sorts", "Partie civile"].map(APEL_TEXTES.estTitreChapitre));
  assert.deepEqual(titres, [true, true, true, true, true, false, false]);
  console.log("• lignes qui commencent par « partie », « scène »… : pas des titres");

  // Livre mis en page comme un PDF imprimé : page de titre, épigraphe, dédicace seule sur sa page,
  // puis « Chapitre I » en haut de page, texte justifié (cas du Sort des Hiboux Boiteux).
  if (soffice) {
    const long = "La voix de mon père faisait trembler les vieilles poutres de la case familiale. J'étais comme secoué par elle, elle me faisait peur. J'accourus, comme aspiré par ses mots, et me plantai devant lui, tremblant, sans oser lever les yeux vers son visage.";
    const imprime = path.join(TMP, "imprime.docx");
    fs.writeFileSync(imprime, fabriquerDocx([
      { centre: true, runs: [["SERTHY AYISSI", "b"]] }, { centre: true, runs: [["LE SORT DES HIBOUX BOITEUX", "b"]] },
      { saut: true, centre: true, runs: [["« Rien n'arrive jamais par hasard. »", "i"]] },
      { saut: true, aligne: "right", runs: [["À ma famille", "i"]] },
      { saut: true, centre: true, runs: [["Chapitre I", "b"]] },
      "« Abe, viens ici ! »",
      { aligne: "both", runs: [[long, ""]] },
      // Lignes de texte qui commencent par « partie », « Scène »… : ce ne sont pas des titres.
      "partie des sorts et on n'entend plus rien.", "Scène étrange. Une lueur blanche passa.", "Partie de chasse au village.",
      { aligne: "both", runs: [[long + " " + long, ""]] },
      { saut: true, centre: true, runs: [["Chapitre II", "b"]] },
      { aligne: "both", runs: [["Mon père me donna le nom d'Abenem, mauvais cœur, le jour de ma naissance. " + long, ""]] }
    ]));
    execFileSync("soffice", ["--headless", "--convert-to", "pdf", "--outdir", TMP, imprime], { stdio: "ignore", timeout: 120000 });
    await p.evaluate(() => { const i = document.createElement("input"); i.type = "file"; i.id = "essai"; document.body.appendChild(i); });
    await p.setInputFiles("#essai", path.join(TMP, "imprime.pdf"));
    const r = await p.evaluate(() => APEL_TEXTES.lire(document.getElementById("essai").files[0]).then(x => x.chapitres.map(c => ({ titre: c.titre, avant: !!c.avant, blocs: c.blocs }))));
    assert.deepEqual(r.filter(c => !c.avant).map(c => c.titre), ["Chapitre I", "Chapitre II"], "pdf imprimé : chapitres " + JSON.stringify(r.map(c => c.titre)));
    const avant = JSON.stringify(r.find(c => c.avant) || {});
    assert.ok(avant.includes("À ma famille") && !avant.includes("Chapitre I"), "la dédicace reste à part : " + avant);
    const ch1 = r.find(c => c.titre === "Chapitre I").blocs;
    assert.equal(ch1[0].r[0][0], "« Abe, viens ici ! »");
    assert.ok(ch1.slice(1).every(b => b.s === "p"), "texte justifié jamais centré : " + JSON.stringify(ch1.map(b => b.s)));
    assert.ok(JSON.stringify(ch1).includes("partie des sorts") && JSON.stringify(ch1).includes("Scène étrange"), "les lignes « partie… », « Scène… » restent dans le chapitre");
    await p.evaluate(() => document.getElementById("essai").remove());
    console.log("• pdf imprimé (dédicace, Chapitre I en haut de page)");
  }
  const refus = await p.evaluate(() => APEL_TEXTES.lire(new File(["x"], "vieux.doc")).catch(e => e.message));
  assert.match(refus, /Enregistrer sous/);
  assert.deepEqual(erreurs, []);
  console.log("\nFormats de texte : tout est bon.");
} finally {
  await navigateur.close();
  await s.arreter();
  fs.rmSync(TMP, { recursive: true, force: true });
}
