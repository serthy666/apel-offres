// Espace gérant d'APEL Éditions (fonction Cloudflare, adresse /api/gerant), page gerant.html.
// Connexion avec Google : entrent le propriétaire (apeledition@gmail.com) et les Gmail qu'il a ajoutés.
// On y crée les codes de lecture (24 h, semaine, mois, promo), on publie les livres à lire
// (chapitres importés d'un fichier Word) et on règle les tarifs. Variables : voir functions/_lecture.js.
import { Refus, json, erreur, traiter, base, pret, maintenant, signer, lireJeton, jetonDe, nouveauCode, cleCode, txt, texteLong, entier, reglages, estGerant, proprietaire, lienVideo, deplierLien, video, FORMULES, APPAREIL, ID_LIVRE, GENRES, CLE_MEDIA } from "../_lecture.js";

const DUREE_SESSION = 8 * 3600;
const GMAIL = /^[a-z0-9.+_-]+@(gmail|googlemail)\.com$/;
const CHAPITRES_MAX = 400;
const CHAPITRE_MAX = 400000; // caractères du chapitre une fois rangé
const STYLES = ["p", "c", "h", "q", "sep"];
const VIDEO_MAX = 60 * 1024 * 1024; // octets : une petite vidéo (1 à 3 minutes) filmée au téléphone
const AFFICHE_MAX = 600 * 1024;
const TYPES_MEDIA = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "video/x-m4v": "m4v", "video/3gpp": "3gp", "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" };

export function onRequest({ request, env }) {
  return traiter(async () => {
    if (request.method === "GET") {
      const url = new URL(request.url), action = url.searchParams.get("action");
      if (action === "config") return json({ clientId: env.GOOGLE_CLIENT_ID || "", pret: pret(env) && !!env.GOOGLE_CLIENT_ID, proprietaire: proprietaire(env) });
      if (action === "tableau") return tableau(request, env);
      if (action === "chapitres") return chapitresLivre(request, url, env);
      return erreur(400, "Action inconnue.");
    }
    if (request.method !== "POST") return erreur(405, "Méthode non acceptée.");
    if (!pret(env) || !env.GOOGLE_CLIENT_ID) return erreur(503, "L'espace gérant n'est pas encore configuré.");
    // Téléversement d'une vidéo ou de son affiche : le fichier arrive tel quel, sans JSON.
    if (new URL(request.url).searchParams.get("action") === "televerser") return televerser(request, env);
    let corps;
    try { corps = await request.json(); } catch (e) { return erreur(400, "Requête illisible."); }
    const actions = { connexion, codes: creerCodes, promo: creerPromo, revoquer, livre: enregistrerLivre, supprimer: supprimerLivre, reglages: enregistrerReglages, inviter, retirer, pass: passGerant, video: enregistrerVideo, video_supprimer: supprimerVideo };
    const fn = corps && actions[corps.action];
    if (!fn) return erreur(400, "Action inconnue.");
    return fn(request, corps, env);
  });
}

/* Connexion : jeton Google vérifié, puis adresse cherchée parmi les gérants */
async function connexion(request, corps, env) {
  const db = await base(env);
  const email = await verifierGoogle(String(corps.credential || ""), env);
  const proprio = email === proprietaire(env);
  const g = await db.prepare("SELECT statut FROM gerants WHERE email = ?").bind(email).first();
  if (!proprio && !g) throw new Refus(403, "Le compte " + email + " n'a pas accès à l'espace gérant. Demandez à APEL Éditions de vous ajouter.");
  if (g && g.statut !== "actif") await db.prepare("UPDATE gerants SET statut = 'actif', depuis = ? WHERE email = ?").bind(new Date().toISOString().slice(0, 10), email).run();
  const f = maintenant() + DUREE_SESSION;
  return json({ jeton: await signer({ s: "gerant", e: email, f }, env), email, proprietaire: proprio, expire: f });
}
async function verifierGoogle(credential, env) {
  if (!credential || credential.length > 5000) throw new Refus(401, "Connexion Google manquante.");
  const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
  if (!r.ok) throw new Refus(401, "Connexion Google refusée, réessayez.");
  const t = await r.json();
  const emetteurOk = t.iss === "accounts.google.com" || t.iss === "https://accounts.google.com";
  const verifie = t.email_verified === true || t.email_verified === "true";
  if (t.aud !== env.GOOGLE_CLIENT_ID || !emetteurOk || !(Number(t.exp) > Date.now() / 1000) || !verifie || !t.email) throw new Refus(401, "Connexion Google refusée, réessayez.");
  return String(t.email).toLowerCase();
}
// Adresse connectée, revérifiée à chaque appel : un gérant retiré perd l'accès tout de suite.
async function session(request, env, db) {
  const c = await lireJeton(jetonDe(request), env, "gerant");
  if (!c) throw new Refus(401, "Session terminée, reconnectez-vous.");
  const email = String(c.e || "");
  if (!(await estGerant(db, env, email))) throw new Refus(403, "Ce compte n'a plus accès à l'espace gérant.");
  return email;
}

/* Tableau de bord */
function etatCode(c, t) {
  if (c.revoque) return "revoque";
  if (c.type === "promo") return (c.jusqua && t > c.jusqua) || (c.max && c.utilises >= c.max) ? "fini" : "actif";
  if (!c.debut) return "neuf";
  return c.fin > t ? "actif" : "fini";
}
async function tableau(request, env) {
  const db = await base(env);
  const moi = await session(request, env, db);
  const t = maintenant();
  const [livres, chap, codes, gerants, r, lecteurs, vids] = await Promise.all([
    db.prepare("SELECT * FROM livres ORDER BY ordre, titre").all(),
    db.prepare("SELECT livre, COUNT(*) AS n, SUM(mots) AS mots, MAX(maj) AS maj FROM chapitres GROUP BY livre").all(),
    db.prepare("SELECT * FROM codes ORDER BY cree DESC LIMIT 500").all(),
    db.prepare("SELECT * FROM gerants ORDER BY email").all(),
    reglages(db),
    db.prepare("SELECT COUNT(DISTINCT appareil) AS n FROM activations WHERE fin > ?").bind(t).first(),
    db.prepare("SELECT * FROM videos ORDER BY ordre, cree DESC").all()
  ]);
  const stats = {}; (chap.results || []).forEach(x => { stats[x.livre] = x; });
  return json({
    moi, proprietaire: proprietaire(env), estProprietaire: moi === proprietaire(env), maintenant: t,
    livres: (livres.results || []).map(l => ({ ...l, chapitres: stats[l.id] ? stats[l.id].n : 0, mots: stats[l.id] ? stats[l.id].mots : 0, majChapitres: stats[l.id] ? stats[l.id].maj : 0 })),
    codes: (codes.results || []).map(c => ({ ...c, etat: etatCode(c, t) })),
    gerants: gerants.results || [],
    reglages: r,
    lecteursActifs: lecteurs ? lecteurs.n : 0,
    videos: (vids.results || []).map(v => ({ ...v, apercu: video(v) })),
    medias: !!env.MEDIAS
  });
}
async function chapitresLivre(request, url, env) {
  const db = await base(env);
  await session(request, env, db);
  const id = String(url.searchParams.get("livre") || "");
  if (!ID_LIVRE.test(id)) throw new Refus(400, "Livre inconnu.");
  const r = await db.prepare("SELECT n, titre, blocs, mots, maj FROM chapitres WHERE livre = ? ORDER BY n").bind(id).all();
  return json({ chapitres: (r.results || []).map(c => ({ n: c.n, titre: c.titre || "", mots: c.mots, maj: c.maj || 0, blocs: JSON.parse(c.blocs || "[]") })) });
}

/* Codes de lecture */
async function creerCodes(request, corps, env) {
  const db = await base(env);
  const moi = await session(request, env, db);
  const f = FORMULES[corps.type];
  if (!f) throw new Refus(400, "Choisissez 24 heures, 1 semaine ou 1 mois.");
  const nombre = entier(corps.nombre, 1, 50), note = txt(corps.note, 120), t = maintenant();
  const crees = [];
  for (let i = 0; i < nombre; i++) {
    let affiche = nouveauCode(), essais = 0;
    while (await db.prepare("SELECT code FROM codes WHERE code = ?").bind(cleCode(affiche)).first()) { affiche = nouveauCode(); if (++essais > 5) throw new Refus(500, "Réessayez."); }
    await db.prepare("INSERT INTO codes (code, affiche, type, jours, max, note, cree, par) VALUES (?, ?, ?, ?, 1, ?, ?, ?)").bind(cleCode(affiche), affiche, corps.type, f.jours, note, t + i, moi).run();
    crees.push({ code: cleCode(affiche), affiche, type: corps.type, jours: f.jours, note });
  }
  return json({ ok: true, codes: crees });
}
async function creerPromo(request, corps, env) {
  const db = await base(env);
  const moi = await session(request, env, db);
  const affiche = String(corps.mot || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9-]/g, "").replace(/^-+|-+$/g, "").slice(0, 24);
  const code = cleCode(affiche);
  if (code.length < 4) throw new Refus(400, "Le code promo doit avoir au moins 4 lettres ou chiffres, par exemple RENTREE2026.");
  const jours = entier(corps.jours, 1, 365), max = entier(corps.max, 0, 100000);
  let jusqua = null;
  if (corps.jusqua) {
    const d = Date.parse(String(corps.jusqua) + "T23:59:59+01:00");
    if (!Number.isFinite(d)) throw new Refus(400, "Date de fin illisible.");
    jusqua = Math.floor(d / 1000);
    if (jusqua < maintenant()) throw new Refus(400, "La date de fin est déjà passée.");
  }
  if (await db.prepare("SELECT code FROM codes WHERE code = ?").bind(code).first()) throw new Refus(400, "Ce code existe déjà. Choisissez un autre mot.");
  await db.prepare("INSERT INTO codes (code, affiche, type, jours, max, jusqua, note, cree, par) VALUES (?, ?, 'promo', ?, ?, ?, ?, ?, ?)")
    .bind(code, affiche, jours, max, jusqua, txt(corps.note, 120), maintenant(), moi).run();
  return json({ ok: true, code: { code, affiche, type: "promo", jours, max, jusqua } });
}
async function revoquer(request, corps, env) {
  const db = await base(env);
  await session(request, env, db);
  const code = cleCode(corps.code);
  const r = await db.prepare("UPDATE codes SET revoque = ? WHERE code = ?").bind(corps.annuler ? 0 : 1, code).run();
  if (!r.meta || !r.meta.changes) throw new Refus(404, "Code introuvable.");
  return json({ ok: true });
}

/* Livres à lire en ligne : chapitres préparés par la page à partir du fichier Word */
function nettoyerBlocs(blocs) {
  if (!Array.isArray(blocs)) throw new Refus(400, "Chapitre illisible.");
  let mots = 0;
  const propres = blocs.slice(0, 5000).map(b => {
    const s = STYLES.indexOf(b && b.s) >= 0 ? b.s : "p";
    if (s === "sep") return { s };
    const r = (Array.isArray(b.r) ? b.r : []).slice(0, 400).map(x => {
      const texte = String(Array.isArray(x) ? x[0] : "").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").slice(0, 20000);
      const f = Array.isArray(x) ? entier(x[1], 0, 3) : 0;
      return f ? [texte, f] : [texte];
    }).filter(x => x[0]);
    r.forEach(x => { mots += (x[0].match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []).length; });
    return r.length ? { s, r } : null;
  }).filter(Boolean);
  return { blocs: propres, mots };
}
async function enregistrerLivre(request, corps, env) {
  const db = await base(env);
  await session(request, env, db);
  const l = corps.livre || {};
  const id = String(l.id || "").toLowerCase();
  if (!ID_LIVRE.test(id)) throw new Refus(400, "Code du livre invalide : lettres minuscules, chiffres et tirets.");
  const titre = txt(l.titre, 160);
  if (!titre) throw new Refus(400, "Donnez un titre au livre.");
  const t = maintenant();
  const existant = await db.prepare("SELECT id FROM livres WHERE id = ?").bind(id).first();
  const ops = [];
  const genre = GENRES.indexOf(l.genre) >= 0 ? l.genre : "";
  ops.push(db.prepare("INSERT INTO livres (id, titre, auteur, resume, genre, gratuits, visible, ordre, maj) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(id) DO UPDATE SET titre = excluded.titre, auteur = excluded.auteur, resume = excluded.resume, genre = excluded.genre, gratuits = excluded.gratuits, visible = excluded.visible, ordre = excluded.ordre" + (Array.isArray(corps.chapitres) ? ", maj = excluded.maj" : ""))
    .bind(id, titre, txt(l.auteur, 120), texteLong(l.resume, 1500), genre, entier(l.gratuits, 0, 50), l.visible === false ? 0 : 1, entier(l.ordre, 0, 9999), t));
  let nb = null;
  if (Array.isArray(corps.chapitres)) {
    if (!corps.chapitres.length) throw new Refus(400, "Aucun chapitre à publier.");
    if (corps.chapitres.length > CHAPITRES_MAX) throw new Refus(400, "Trop de chapitres (" + CHAPITRES_MAX + " au plus).");
    const ajout = corps.mode === "ajouter";
    let depart = 0;
    if (ajout) { const m = await db.prepare("SELECT MAX(n) AS n FROM chapitres WHERE livre = ?").bind(id).first(); depart = (m && m.n) || 0; }
    else ops.push(db.prepare("DELETE FROM chapitres WHERE livre = ?").bind(id));
    corps.chapitres.forEach((c, i) => {
      const { blocs, mots } = nettoyerBlocs(c && c.blocs);
      const texte = JSON.stringify(blocs);
      if (texte.length > CHAPITRE_MAX) throw new Refus(413, "Le chapitre « " + txt(c.titre, 60) + " » est trop long : coupez-le en deux dans le fichier Word.");
      if (!blocs.length) throw new Refus(400, "Le chapitre « " + txt(c.titre, 60) + " » est vide.");
      // Un chapitre déjà publié et inchangé garde sa date : seuls les vrais nouveaux chapitres sont annoncés « Nouveau ».
      ops.push(db.prepare("INSERT INTO chapitres (livre, n, titre, blocs, mots, maj) VALUES (?, ?, ?, ?, ?, ?)").bind(id, depart + i + 1, txt(c.titre, 160) || "Chapitre " + (depart + i + 1), texte, mots, c.ancien && !ajout ? entier(c.ancien, 0, t) : t));
    });
    nb = depart + corps.chapitres.length;
  } else if (!existant) throw new Refus(400, "Importez d'abord le fichier Word du livre.");
  await db.batch(ops);
  return json({ ok: true, id, chapitres: nb });
}
async function supprimerLivre(request, corps, env) {
  const db = await base(env);
  await session(request, env, db);
  const id = String(corps.id || "");
  if (!ID_LIVRE.test(id)) throw new Refus(400, "Livre inconnu.");
  await db.batch([
    db.prepare("DELETE FROM chapitres WHERE livre = ?").bind(id),
    db.prepare("DELETE FROM reactions WHERE livre = ?").bind(id),
    db.prepare("DELETE FROM livres WHERE id = ?").bind(id)
  ]);
  return json({ ok: true });
}

/* Petites vidéos : bande-annonce d'un livre, mot de l'auteur, coulisses… */
function idAleatoire() { const o = crypto.getRandomValues(new Uint8Array(12)); let s = ""; for (const x of o) s += (x % 36).toString(36); return s; }
async function televerser(request, env) {
  const db = await base(env);
  await session(request, env, db);
  if (!env.MEDIAS) throw new Refus(503, "Le stockage des vidéos (R2 « MEDIAS ») n'est pas encore relié au site. En attendant, ajoutez la vidéo par un lien YouTube, TikTok ou Facebook.");
  const sorte = new URL(request.url).searchParams.get("sorte") === "affiche" ? "affiches" : "videos";
  const type = String(request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = TYPES_MEDIA[type];
  if (!ext || (sorte === "videos") !== type.startsWith("video/")) throw new Refus(415, sorte === "videos" ? "Format de vidéo non accepté : choisissez une vidéo MP4 (celles du téléphone conviennent)." : "Image d'affiche non acceptée.");
  const max = sorte === "videos" ? VIDEO_MAX : AFFICHE_MAX;
  if (Number(request.headers.get("content-length") || 0) > max) throw new Refus(413, sorte === "videos" ? "Vidéo trop lourde (60 Mo au plus) : gardez-la courte, 1 à 3 minutes." : "Affiche trop lourde.");
  const donnees = await request.arrayBuffer();
  if (!donnees.byteLength) throw new Refus(400, "Fichier vide.");
  if (donnees.byteLength > max) throw new Refus(413, "Vidéo trop lourde (60 Mo au plus) : gardez-la courte, 1 à 3 minutes.");
  const cle = sorte + "/" + idAleatoire() + "." + ext;
  await env.MEDIAS.put(cle, donnees, { httpMetadata: { contentType: type } });
  return json({ ok: true, cle });
}
async function enregistrerVideo(request, corps, env) {
  const db = await base(env);
  await session(request, env, db);
  const v = corps.video || {};
  const titre = txt(v.titre, 120);
  if (!titre) throw new Refus(400, "Donnez un titre à la vidéo.");
  const cle = String(v.cle || "");
  let lien = "";
  if (cle) { if (!CLE_MEDIA.test(cle) || !cle.startsWith("videos/")) throw new Refus(400, "Vidéo introuvable : téléversez-la de nouveau."); }
  else {
    lien = await deplierLien(txt(v.lien, 500));
    if (!lienVideo(lien)) throw new Refus(400, "Lien non reconnu. Collez le lien d'une vidéo YouTube, TikTok, Facebook, Instagram ou Google Drive.");
  }
  const affiche = CLE_MEDIA.test(String(v.affiche || "")) && String(v.affiche).startsWith("affiches/") ? v.affiche : "";
  const livre = ID_LIVRE.test(String(v.livre || "")) ? v.livre : "";
  const id = /^[a-z0-9]{8,40}$/.test(String(v.id || "")) ? v.id : idAleatoire();
  const ancien = await db.prepare("SELECT cle, affiche FROM videos WHERE id = ?").bind(id).first();
  await db.prepare("INSERT INTO videos (id, titre, description, livre, lien, cle, affiche, duree, visible, ordre, cree) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(id) DO UPDATE SET titre = excluded.titre, description = excluded.description, livre = excluded.livre, lien = excluded.lien, cle = excluded.cle, affiche = excluded.affiche, duree = excluded.duree, visible = excluded.visible, ordre = excluded.ordre")
    .bind(id, titre, texteLong(v.description, 500), livre, lien, cle, affiche, entier(v.duree, 0, 36000), v.visible === false ? 0 : 1, entier(v.ordre, 0, 9999), maintenant()).run();
  // Fichiers remplacés : retirés du stockage
  if (ancien && env.MEDIAS) for (const k of [ancien.cle, ancien.affiche]) if (k && k !== cle && k !== affiche) await env.MEDIAS.delete(k);
  return json({ ok: true, id });
}
async function supprimerVideo(request, corps, env) {
  const db = await base(env);
  await session(request, env, db);
  const v = await db.prepare("SELECT cle, affiche FROM videos WHERE id = ?").bind(String(corps.id || "")).first();
  if (!v) throw new Refus(404, "Vidéo introuvable.");
  await db.prepare("DELETE FROM videos WHERE id = ?").bind(String(corps.id)).run();
  if (env.MEDIAS) for (const k of [v.cle, v.affiche]) if (k) await env.MEDIAS.delete(k);
  return json({ ok: true });
}

/* Tarifs et mot d'accueil du Salon */
async function enregistrerReglages(request, corps, env) {
  const db = await base(env);
  await session(request, env, db);
  const r = corps.reglages || {};
  const valeurs = { prix_jour: txt(r.prix_jour, 40), prix_semaine: txt(r.prix_semaine, 40), prix_mois: txt(r.prix_mois, 40), accueil: texteLong(r.accueil, 400) };
  await db.batch(Object.keys(valeurs).map(k => db.prepare("INSERT OR REPLACE INTO reglages (cle, valeur) VALUES (?, ?)").bind(k, valeurs[k])));
  return json({ ok: true, reglages: valeurs });
}

/* Pass de lecture du gérant (12 heures) pour relire les chapitres publiés comme un abonné */
async function passGerant(request, corps, env) {
  const db = await base(env);
  const moi = await session(request, env, db);
  const appareil = String(corps.appareil || "");
  if (!APPAREIL.test(appareil)) throw new Refus(400, "Appareil non reconnu.");
  const fin = maintenant() + 12 * 3600;
  return json({ jeton: await signer({ s: "lecteur", c: "gerant:" + moi, a: appareil, f: fin }, env), fin, type: "gerant", formule: "Pass gérant" });
}

/* Gérants : seul le propriétaire invite ou retire */
async function inviter(request, corps, env) {
  const db = await base(env);
  const moi = await session(request, env, db);
  if (moi !== proprietaire(env)) throw new Refus(403, "Seul le propriétaire peut ajouter un gérant.");
  const email = String(corps.email || "").trim().toLowerCase();
  if (!GMAIL.test(email)) throw new Refus(400, "Entrez une adresse Gmail complète, par exemple prenom.nom@gmail.com.");
  if (email === proprietaire(env) || (await db.prepare("SELECT email FROM gerants WHERE email = ?").bind(email).first())) throw new Refus(400, "Ce compte est déjà gérant.");
  await db.prepare("INSERT INTO gerants (email, statut, depuis) VALUES (?, 'invite', ?)").bind(email, new Date().toISOString().slice(0, 10)).run();
  return json({ ok: true });
}
async function retirer(request, corps, env) {
  const db = await base(env);
  const moi = await session(request, env, db);
  if (moi !== proprietaire(env)) throw new Refus(403, "Seul le propriétaire peut retirer un gérant.");
  await db.prepare("DELETE FROM gerants WHERE email = ?").bind(String(corps.email || "").trim().toLowerCase()).run();
  return json({ ok: true });
}
