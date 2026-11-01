// Serveur de test : sert site/ comme Cloudflare et fait tourner functions/api/gerant.js,
// avec un faux GitHub (dépôt en mémoire) et une fausse vérification Google.
// Lancer seul pour essayer en local : node tests/serveur.mjs  puis ouvrir http://localhost:8788
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CLIENT_ID = "test-client.apps.googleusercontent.com";
export const PROPRIO = "shoppingrlux12@gmail.com";
export const DEPOT = "serthy666/apel-offres";
export const DOSSIER = "shopping-rlux/site/"; // la boutique vit dans ce dossier du dépôt

function sha1(buf) { return crypto.createHash("sha1").update(buf).digest("hex"); }

// Catalogue de départ des tests : fixe, indépendant du vrai catalogue que la propriétaire modifie en ligne
// (les deux livres de Robyn Tyo'o, coordonnées d'origine, sans groupe ni chaîne WhatsApp enregistrés).
export const CATALOGUE_TEST = {
  "config": {
    "whatsapp": "237676962519",
    "whatsapp2": "237690808155",
    "email": PROPRIO,
    "facebook": "",
    "tiktok": "",
    "annonce": ""
  },
  "produits": [
    {
      "id": "livre-miroir-desirs-1",
      "nom": "Dans le miroir de nos désirs (Tome 1)",
      "rayon": "livres",
      "categorie": "Romans",
      "marque": "APEL Éditions",
      "details": "Faidherbe, jeune homme aux habitudes de goujat, ne laisse aucune femme indifférente. Bien qu’il les voie comme des objets sexuels depuis son adolescence, sa vie va prendre un curieux tournant après sa rencontre avec Tony, une femme au charme saisissant qui aime autant jouer que lui. Qui des deux joueurs finira par être pris à son propre piège ?",
      "options": "",
      "auteur": "Robyn Tyo’o",
      "lien": "https://www.youscribe.com/catalogue/ebooks/litterature/romans-et-nouvelles/dans-le-miroir-de-nos-desirs-tome-1-3663543",
      "prix": 5000,
      "prixPromo": 0,
      "nouveau": false,
      "vedette": false,
      "stock": "ok",
      "visible": true,
      "photos": [
        "photos/livre-dans-le-miroir-de-nos-desirs.webp"
      ]
    },
    {
      "id": "livre-souhaits-maudits",
      "nom": "Souhaits maudits",
      "rayon": "livres",
      "categorie": "Romans",
      "marque": "APEL Éditions",
      "details": "Une jeune femme pleine de vie est confrontée à un dilemme. Face à cela, elle se retrouve à enfreindre ses convictions spirituelles et ses principes moraux, ce qui la conduira à commettre des actes malsains qui la rattraperont. Paranormal, morts, religion et amour : vous saurez les choix qui vont la conduire vers des chemins obscurs.",
      "options": "",
      "auteur": "Robyn Tyo’o",
      "lien": "",
      "prix": 5000,
      "prixPromo": 0,
      "nouveau": false,
      "vedette": false,
      "stock": "ok",
      "visible": true,
      "photos": [
        "photos/livre-souhaits-maudits.webp"
      ]
    }
  ]
};
// Petite image de secours si une couverture a été retirée du vrai dépôt
const PNG_1PX = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

// Faux dépôt : chaque commit garde une copie complète des fichiers.
export function fauxDepot() {
  const commits = new Map(), blobs = new Map();
  const depart = new Map();
  depart.set(DOSSIER + "donnees/produits.json", Buffer.from(JSON.stringify(CATALOGUE_TEST, null, 2) + "\n"));
  depart.set(DOSSIER + "donnees/comptes.json", Buffer.from(JSON.stringify({ comptes: [] }, null, 2) + "\n"));
  for (const p of CATALOGUE_TEST.produits) for (const ph of p.photos) {
    const disque = path.join(RACINE, "site", ph);
    depart.set(DOSSIER + ph, fs.existsSync(disque) ? fs.readFileSync(disque) : PNG_1PX);
  }
  depart.set("index.html", Buffer.from("APEL Éditions (autre site du même dépôt)"));
  const premier = sha1("depart");
  commits.set(premier, { fichiers: depart, parents: [], message: "Départ" });
  const depot = { head: premier, commits, blobs, journal: [], pannes: 0 };
  depot.fichiers = (ref) => commits.get(ref && commits.has(ref) ? ref : depot.head).fichiers;
  depot.lire = (chemin) => { const b = depot.fichiers().get(DOSSIER + chemin); return b ? b.toString("utf8") : null; };
  depot.brut = (chemin) => depot.fichiers().get(DOSSIER + chemin) || null;
  return depot;
}

function reponse(statut, corps) { return new Response(corps == null ? null : JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } }); }

function fauxGithub(depot, url, init) {
  const u = new URL(url), m = (init && init.method) || "GET";
  if (!u.pathname.startsWith("/repos/" + DEPOT + "/")) return reponse(404, { message: "Not Found" });
  const p = u.pathname.slice(("/repos/" + DEPOT).length);
  const corps = init && init.body ? JSON.parse(init.body) : null;
  if (!/^Bearer test-jeton$/.test((init.headers || {}).authorization || "")) return reponse(401, { message: "Bad credentials" });
  if (depot.pannes > 0) { depot.pannes--; return reponse(500, { message: "panne" }); }
  let r;
  if ((r = p.match(/^\/contents\/(.+)$/))) {
    const chemin = decodeURIComponent(r[1]);
    if (m === "GET") {
      const ref = u.searchParams.get("ref");
      const b = depot.fichiers(ref === "main" ? null : ref).get(chemin);
      return b ? reponse(200, { sha: sha1(b), content: b.toString("base64") }) : reponse(404, { message: "Not Found" });
    }
    if (m === "PUT") {
      const actuel = depot.fichiers().get(chemin);
      if ((actuel ? sha1(actuel) : undefined) !== corps.sha) return reponse(409, { message: "sha mismatch" });
      const fichiers = new Map(depot.fichiers());
      fichiers.set(chemin, Buffer.from(corps.content, "base64"));
      const sha = sha1(depot.head + corps.message + Date.now() + Math.random());
      depot.commits.set(sha, { fichiers, parents: [depot.head], message: corps.message });
      depot.head = sha; depot.journal.push(corps.message);
      return reponse(200, { commit: { sha } });
    }
  }
  if (p === "/git/ref/heads/main" && m === "GET") return reponse(200, { object: { sha: depot.head } });
  if ((r = p.match(/^\/git\/commits\/(\w+)$/)) && m === "GET") return depot.commits.has(r[1]) ? reponse(200, { tree: { sha: "arbre-" + r[1] } }) : reponse(404, {});
  if (p === "/git/blobs" && m === "POST") { const b = Buffer.from(corps.content, "base64"); const sha = sha1(b); depot.blobs.set(sha, b); return reponse(201, { sha }); }
  if (p === "/git/trees" && m === "POST") {
    const fichiers = new Map(depot.commits.get(corps.base_tree.replace(/^arbre-/, "")).fichiers);
    for (const e of corps.tree) {
      if (e.sha === null) { if (!fichiers.has(e.path)) return reponse(422, { message: "suppression d'un fichier absent " + e.path }); fichiers.delete(e.path); }
      else if (e.content != null) fichiers.set(e.path, Buffer.from(e.content, "utf8"));
      else fichiers.set(e.path, depot.blobs.get(e.sha));
    }
    const sha = "t" + sha1(String(Math.random()));
    depot.arbres = depot.arbres || new Map(); depot.arbres.set(sha, fichiers);
    return reponse(201, { sha });
  }
  if (p === "/git/commits" && m === "POST") {
    const sha = sha1(corps.message + Math.random());
    depot.commits.set(sha, { fichiers: depot.arbres.get(corps.tree), parents: corps.parents, message: corps.message });
    return reponse(201, { sha });
  }
  if (p === "/git/refs/heads/main" && m === "PATCH") {
    const c = depot.commits.get(corps.sha);
    if (!c || c.parents[0] !== depot.head) return reponse(422, { message: "Update is not a fast forward" });
    depot.head = corps.sha; depot.journal.push(c.message);
    return reponse(200, { object: { sha: corps.sha } });
  }
  return reponse(404, { message: "faux GitHub : " + m + " " + p });
}

function fauxGoogle(url) {
  const jeton = new URL(url).searchParams.get("id_token") || "";
  const m = jeton.match(/^test:(.+)$/);
  if (!m) return reponse(400, { error: "invalid_token" });
  const [email, aud] = m[1].split("|");
  return reponse(200, { iss: "https://accounts.google.com", aud: aud || CLIENT_ID, email, email_verified: "true", exp: String(Math.floor(Date.now() / 1000) + 3600) });
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".txt": "text/plain" };

export async function demarrer({ port = 0, env = {} } = {}) {
  const depot = fauxDepot();
  const vraiFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.startsWith("https://api.github.com/")) return fauxGithub(depot, u, init || {});
    if (u.startsWith("https://oauth2.googleapis.com/tokeninfo")) return fauxGoogle(u);
    return vraiFetch(url, init);
  };
  const { onRequest } = await import(path.join(RACINE, "functions/api/gerant.js"));
  const ENV = { GOOGLE_CLIENT_ID: CLIENT_ID, PROPRIETAIRE: PROPRIO, GITHUB_TOKEN: "test-jeton", ...env };
  const serveur = http.createServer(async (req, res) => {
    const u = new URL(req.url, "http://localhost");
    if (u.pathname === "/api/gerant") {
      const morceaux = []; for await (const c of req) morceaux.push(c);
      const request = new Request("http://localhost" + req.url, { method: req.method, headers: req.headers, body: req.method === "GET" ? undefined : Buffer.concat(morceaux) });
      const r = await onRequest({ request, env: ENV });
      res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
    }
    // Comme Cloudflare après republication : données et photos lues dans le dépôt
    let chemin = decodeURIComponent(u.pathname); if (chemin === "/") chemin = "/index.html";
    const dansDepot = depot.fichiers().get(DOSSIER + chemin.slice(1));
    const surDisque = path.join(RACINE, "site", chemin);
    let contenu = null;
    if (dansDepot) contenu = dansDepot;
    else if (!/^\/(donnees|photos)\//.test(chemin) && surDisque.startsWith(path.join(RACINE, "site")) && fs.existsSync(surDisque) && fs.statSync(surDisque).isFile()) contenu = fs.readFileSync(surDisque);
    if (!contenu) { res.writeHead(404, { "content-type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(path.join(RACINE, "site/404.html"))); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(chemin)] || "application/octet-stream" }); res.end(contenu);
  });
  await new Promise(ok => serveur.listen(port, ok));
  const adresse = "http://localhost:" + serveur.address().port;
  return { url: adresse, depot, env: ENV, arreter: () => new Promise(ok => { serveur.close(ok); globalThis.fetch = vraiFetch; }) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const s = await demarrer({ port: 8788 });
  console.log("Boutique de test sur " + s.url + " (connexion : jeton « test:" + PROPRIO + " »)");
}
