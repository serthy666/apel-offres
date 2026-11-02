// Outils communs au Salon de lecture (/api/lecture) et à l'espace gérant (/api/gerant).
//
// Les chapitres, les codes de lecture et les gérants sont rangés dans une base Cloudflare D1
// (liaison « DB »), jamais dans le dépôt GitHub : le dépôt est public, les textes payants n'y vont pas.
// Les tables se créent toutes seules au premier appel.
//
// Variables Cloudflare (Pages > apel-offres > Settings > Variables and Secrets) :
//   GOOGLE_CLIENT_ID  identifiant du client OAuth Google (…apps.googleusercontent.com)
//   SESSION_SECRET    longue phrase secrète qui signe les sessions des gérants et des lecteurs (secret)
//   PROPRIETAIRE      facultatif, Gmail du propriétaire (apeledition@gmail.com par défaut)
// Liaison (Settings > Bindings) : base D1 nommée « DB ».

export const PROPRIETAIRE_DEFAUT = "apeledition@gmail.com";
export const JOUR = 86400;
// Formules de lecture : durée en jours, comptée à partir de la première utilisation du code.
export const FORMULES = { jour: { jours: 1, nom: "24 heures" }, semaine: { jours: 7, nom: "1 semaine" }, mois: { jours: 30, nom: "1 mois" } };
// Un code personnel marche sur 2 appareils au plus (téléphone et ordinateur du même lecteur).
export const APPAREILS_MAX = 2;
export const EMOJIS = ["coeur", "rire", "choc", "larme", "feu"];
export const APPAREIL = /^[a-z0-9]{16,40}$/;
export const ID_LIVRE = /^[a-z0-9][a-z0-9-]{0,79}$/;

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS livres (id TEXT PRIMARY KEY, titre TEXT NOT NULL, auteur TEXT, resume TEXT, gratuits INTEGER NOT NULL DEFAULT 1, visible INTEGER NOT NULL DEFAULT 1, ordre INTEGER NOT NULL DEFAULT 0, maj INTEGER)",
  "CREATE TABLE IF NOT EXISTS chapitres (livre TEXT NOT NULL, n INTEGER NOT NULL, titre TEXT, blocs TEXT NOT NULL, mots INTEGER NOT NULL DEFAULT 0, maj INTEGER, PRIMARY KEY (livre, n))",
  "CREATE TABLE IF NOT EXISTS codes (code TEXT PRIMARY KEY, affiche TEXT, type TEXT NOT NULL, jours REAL NOT NULL, max INTEGER NOT NULL DEFAULT 1, utilises INTEGER NOT NULL DEFAULT 0, jusqua INTEGER, debut INTEGER, fin INTEGER, note TEXT, cree INTEGER, par TEXT, revoque INTEGER NOT NULL DEFAULT 0)",
  "CREATE TABLE IF NOT EXISTS activations (code TEXT NOT NULL, appareil TEXT NOT NULL, debut INTEGER NOT NULL, fin INTEGER NOT NULL, PRIMARY KEY (code, appareil))",
  "CREATE TABLE IF NOT EXISTS gerants (email TEXT PRIMARY KEY, statut TEXT NOT NULL, depuis TEXT)",
  "CREATE TABLE IF NOT EXISTS reactions (livre TEXT NOT NULL, n INTEGER NOT NULL, appareil TEXT NOT NULL, emoji TEXT NOT NULL, t INTEGER, PRIMARY KEY (livre, n, appareil))",
  "CREATE TABLE IF NOT EXISTS reglages (cle TEXT PRIMARY KEY, valeur TEXT)"
];
const schemaPret = new WeakSet();

export class Refus extends Error { constructor(statut, message, plus) { super(message); this.statut = statut; this.plus = plus || null; } }
export function json(objet, statut = 200, cache) {
  return new Response(JSON.stringify(objet), { status: statut, headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache || "no-store" } });
}
export function erreur(statut, message, plus) { return json(Object.assign({ erreur: message }, plus || {}), statut); }
export function maintenant() { return Math.floor(Date.now() / 1000); }
export function proprietaire(env) { return String(env.PROPRIETAIRE || PROPRIETAIRE_DEFAUT).trim().toLowerCase(); }
export function pret(env) { return !!(env.DB && env.SESSION_SECRET && String(env.SESSION_SECRET).length >= 16); }

// Gestion des erreurs commune : un Refus devient un message clair, le reste une erreur 500 journalisée.
export async function traiter(fn) {
  try { return await fn(); }
  catch (e) {
    if (e instanceof Refus) return erreur(e.statut, e.message, e.plus);
    console.log("Erreur Salon de lecture :", e && e.stack || e);
    return erreur(500, "Erreur du serveur, réessayez dans un instant.");
  }
}

export async function base(env) {
  if (!pret(env)) throw new Refus(503, "Le Salon de lecture n'est pas encore configuré.");
  if (!schemaPret.has(env.DB)) {
    await env.DB.batch(SCHEMA.map(s => env.DB.prepare(s)));
    schemaPret.add(env.DB);
  }
  return env.DB;
}

/* Jetons signés (HMAC) : sessions des gérants et pass des lecteurs */
async function cle(env) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode("apel-lecture:" + env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
function b64url(octets) { let s = ""; for (const o of octets) s += String.fromCharCode(o); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function deB64url(t) { const s = atob(t.replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(s, c => c.charCodeAt(0)); }
export async function signer(contenu, env) {
  const charge = b64url(new TextEncoder().encode(JSON.stringify(contenu)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await cle(env), new TextEncoder().encode(charge)));
  return charge + "." + b64url(sig);
}
// Contenu du jeton s'il est authentique et pas expiré (champ x ou f en secondes), sinon null.
export async function lireJeton(jeton, env, sorte) {
  const [charge, sig] = String(jeton || "").split(".");
  if (!charge || !sig || charge.length > 2000) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await cle(env), deB64url(sig), new TextEncoder().encode(charge));
    const c = ok ? JSON.parse(new TextDecoder().decode(deB64url(charge))) : null;
    if (!c || c.s !== sorte || !(Number(c.f) > maintenant())) return null;
    return c;
  } catch (e) { return null; }
}
export function jetonDe(request) { return (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim(); }

/* Codes : lettres et chiffres sans confusion possible (ni O/0, ni I/1) */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function nouveauCode() {
  const o = crypto.getRandomValues(new Uint8Array(8));
  let s = ""; for (const x of o) s += ALPHABET[x % ALPHABET.length];
  return s.slice(0, 4) + "-" + s.slice(4);
}
// Forme de comparaison : majuscules, lettres et chiffres seulement (« apel 7k4m-x9qd » = « APEL7K4MX9QD »).
export function cleCode(v) { return String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 30); }

export function txt(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
export function texteLong(v, max) { return String(v == null ? "" : v).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max); }
export function entier(v, min, max) { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; }

export async function reglages(db) {
  const r = await db.prepare("SELECT cle, valeur FROM reglages").all();
  const o = {}; (r.results || []).forEach(x => { o[x.cle] = x.valeur || ""; });
  return o;
}

// Le gérant (ou le propriétaire) est-il toujours autorisé ?
export async function estGerant(db, env, email) {
  if (!email) return false;
  if (email === proprietaire(env)) return true;
  const g = await db.prepare("SELECT email FROM gerants WHERE email = ?").bind(email).first();
  return !!g;
}
