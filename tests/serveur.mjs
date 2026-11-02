// Serveur de test du Salon de lecture : sert le site comme Cloudflare Pages et fait tourner
// functions/api/lecture.js et functions/api/gerant.js, avec une fausse base D1 (SQLite en mémoire)
// et une fausse vérification Google.
// Lancer seul pour essayer en local : node tests/serveur.mjs  puis ouvrir http://localhost:8790
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CLIENT_ID = "test-client.apps.googleusercontent.com";
export const PROPRIO = "apeledition@gmail.com";

// Fausse base D1 : même interface que Cloudflare (prepare, bind, first, all, run, batch).
class Requete {
  constructor(db, sql, args) { this.db = db; this.sql = sql; this.args = args || []; }
  bind(...args) { return new Requete(this.db, this.sql, args.map(a => a === undefined ? null : a)); }
  async first(col) { const r = this.db.prepare(this.sql).get(...this.args); return r ? (col ? r[col] : { ...r }) : null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.args).map(r => ({ ...r })), success: true }; }
  async run() { const r = this.db.prepare(this.sql).run(...this.args); return { success: true, meta: { changes: Number(r.changes) } }; }
  executer() { return /^\s*select/i.test(this.sql) ? { results: this.db.prepare(this.sql).all(...this.args).map(r => ({ ...r })) } : { meta: { changes: Number(this.db.prepare(this.sql).run(...this.args).changes) } }; }
}
export function fausseD1() {
  const db = new DatabaseSync(":memory:");
  return {
    sqlite: db,
    prepare: sql => new Requete(db, sql),
    batch: async reqs => {
      db.exec("BEGIN");
      try { const r = reqs.map(q => q.executer()); db.exec("COMMIT"); return r; }
      catch (e) { db.exec("ROLLBACK"); throw e; }
    }
  };
}

function reponse(statut, corps) { return new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } }); }
function fauxGoogle(url) {
  const jeton = new URL(url).searchParams.get("id_token") || "";
  const m = jeton.match(/^test:(.+)$/);
  if (!m) return reponse(400, { error: "invalid_token" });
  return reponse(200, { iss: "https://accounts.google.com", aud: CLIENT_ID, email: m[1], email_verified: "true", exp: String(Math.floor(Date.now() / 1000) + 3600) });
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };

export async function demarrer({ port = 0, env = {} } = {}) {
  const vraiFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const u = String(url && url.url || url);
    if (u.startsWith("https://oauth2.googleapis.com/tokeninfo")) return fauxGoogle(u);
    return vraiFetch(url, init);
  };
  const lecture = await import(path.join(RACINE, "functions/api/lecture.js"));
  const gerant = await import(path.join(RACINE, "functions/api/gerant.js"));
  const DB = fausseD1();
  const ENV = { GOOGLE_CLIENT_ID: CLIENT_ID, SESSION_SECRET: "une phrase secrète de test assez longue", DB, ...env };
  const serveur = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, "http://localhost");
      const fn = u.pathname === "/api/lecture" ? lecture.onRequest : u.pathname === "/api/gerant" ? gerant.onRequest : null;
      if (fn) {
        const morceaux = []; for await (const c of req) morceaux.push(c);
        const request = new Request("http://localhost" + req.url, { method: req.method, headers: req.headers, body: req.method === "GET" ? undefined : Buffer.concat(morceaux) });
        const r = await fn({ request, env: ENV });
        res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
      }
      let chemin = decodeURIComponent(u.pathname);
      if (chemin === "/") chemin = "/index.html";
      if (chemin === "/gerant") chemin = "/gerant.html";
      const fichier = path.join(RACINE, chemin);
      if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || !fs.statSync(fichier).isFile()) {
        // Comme Cloudflare Pages : la page d'accueil quand un fichier manque
        res.writeHead(200, { "content-type": TYPES[".html"] }); res.end(fs.readFileSync(path.join(RACINE, "index.html"))); return;
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(fichier)] || "application/octet-stream" }); res.end(fs.readFileSync(fichier));
    } catch (e) { console.error(e); res.writeHead(500); res.end("erreur"); }
  });
  await new Promise(ok => serveur.listen(port, ok));
  const adresse = "http://localhost:" + serveur.address().port;
  return { url: adresse, db: DB, env: ENV, arreter: () => new Promise(ok => { serveur.close(ok); globalThis.fetch = vraiFetch; }) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const s = await demarrer({ port: 8790 });
  console.log("Site de test sur " + s.url + " (espace gérant : " + s.url + "/gerant.html)");
}
