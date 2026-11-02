// Salon de lecture (fonction Cloudflare, adresse /api/lecture) : côté lecteurs.
//   GET  ?action=catalogue                    livres à lire en ligne et leurs chapitres (sans le texte)
//   GET  ?action=chapitre&livre=…&n=…          texte d'un chapitre (chapitres offerts, ou pass de lecture)
//   GET  ?action=reactions&livre=…&n=…&appareil=…
//   POST { action: "activer", code, appareil } un code de lecture donne un pass jusqu'à sa date de fin
//   POST { action: "reagir", livre, n, emoji, appareil }
import { Refus, json, erreur, traiter, base, maintenant, signer, lireJeton, jetonDe, cleCode, reglages, estGerant, FORMULES, APPAREILS_MAX, EMOJIS, APPAREIL, ID_LIVRE, JOUR } from "../_lecture.js";

export function onRequest({ request, env }) {
  return traiter(async () => {
    const url = new URL(request.url);
    if (request.method === "GET") {
      const action = url.searchParams.get("action");
      if (action === "catalogue") return catalogue(env);
      if (action === "chapitre") return chapitre(url, request, env);
      if (action === "reactions") return reactionsGet(url, env);
      return erreur(400, "Action inconnue.");
    }
    if (request.method !== "POST") return erreur(405, "Méthode non acceptée.");
    let corps;
    try { corps = await request.json(); } catch (e) { return erreur(400, "Requête illisible."); }
    if (corps && corps.action === "activer") return activer(corps, env);
    if (corps && corps.action === "reagir") return reagir(corps, env);
    return erreur(400, "Action inconnue.");
  });
}

async function catalogue(env) {
  const db = await base(env);
  const [livres, chapitres, r] = await Promise.all([
    db.prepare("SELECT id, titre, auteur, resume, gratuits, ordre, maj FROM livres WHERE visible = 1 ORDER BY ordre, titre").all(),
    db.prepare("SELECT livre, n, titre, mots, maj FROM chapitres ORDER BY livre, n").all(),
    reglages(db)
  ]);
  const parLivre = {};
  (chapitres.results || []).forEach(c => { (parLivre[c.livre] = parLivre[c.livre] || []).push({ n: c.n, titre: c.titre || "", mots: c.mots || 0, maj: c.maj || 0 }); });
  const liste = (livres.results || []).map(l => ({ id: l.id, titre: l.titre, auteur: l.auteur || "", resume: l.resume || "", gratuits: l.gratuits, maj: l.maj || 0, chapitres: parLivre[l.id] || [] }))
    .filter(l => l.chapitres.length);
  return json({
    livres: liste,
    tarifs: { jour: r.prix_jour || "", semaine: r.prix_semaine || "", mois: r.prix_mois || "" },
    accueil: r.accueil || ""
  }, 200, "public, max-age=60");
}

// Pass valide : jeton signé, pas expiré, code toujours actif (un code révoqué coupe l'accès tout de suite).
async function pass(request, env, db) {
  const c = await lireJeton(jetonDe(request), env, "lecteur");
  if (!c) return null;
  const code = String(c.c || "");
  if (code.indexOf("gerant:") === 0) return (await estGerant(db, env, code.slice(7))) ? c : null;
  const row = await db.prepare("SELECT revoque FROM codes WHERE code = ?").bind(code).first();
  return row && !row.revoque ? c : null;
}

async function chapitre(url, request, env) {
  const db = await base(env);
  const livre = String(url.searchParams.get("livre") || "");
  const n = parseInt(url.searchParams.get("n"), 10);
  if (!ID_LIVRE.test(livre) || !(n >= 1)) return erreur(400, "Chapitre inconnu.");
  const l = await db.prepare("SELECT gratuits, visible FROM livres WHERE id = ?").bind(livre).first();
  if (!l || !l.visible) return erreur(404, "Ce livre n'est plus en ligne.");
  const c = await db.prepare("SELECT n, titre, blocs, mots FROM chapitres WHERE livre = ? AND n = ?").bind(livre, n).first();
  if (!c) return erreur(404, "Ce chapitre n'existe pas.");
  const offert = n <= (l.gratuits || 0);
  if (!offert && !(await pass(request, env, db))) return erreur(402, "Ce chapitre est réservé aux abonnés.", { verrou: true });
  return json({ n: c.n, titre: c.titre || "", mots: c.mots || 0, blocs: JSON.parse(c.blocs || "[]"), offert });
}

async function activer(corps, env) {
  const db = await base(env);
  const code = cleCode(corps.code), appareil = String(corps.appareil || "");
  if (!APPAREIL.test(appareil)) throw new Refus(400, "Appareil non reconnu : rechargez la page.");
  if (code.length < 4) throw new Refus(400, "Entrez le code reçu sur WhatsApp.");
  const row = await db.prepare("SELECT * FROM codes WHERE code = ?").bind(code).first();
  if (!row || row.revoque) throw new Refus(404, "Ce code n'existe pas. Vérifiez-le ou écrivez-nous sur WhatsApp.");
  const t = maintenant();
  let fin;
  const deja = await db.prepare("SELECT fin FROM activations WHERE code = ? AND appareil = ?").bind(code, appareil).first();

  if (row.type === "promo") {
    if (deja) {
      if (deja.fin <= t) throw new Refus(410, "Vous avez déjà profité de ce code promo sur cet appareil.");
      fin = deja.fin;
    } else {
      if (row.jusqua && t > row.jusqua) throw new Refus(410, "Ce code promo n'est plus valable.");
      // Compteur augmenté seulement s'il reste des places : deux lecteurs en même temps ne dépassent pas le maximum.
      const r = await db.prepare("UPDATE codes SET utilises = utilises + 1 WHERE code = ? AND (max = 0 OR utilises < max)").bind(code).run();
      if (!r.meta || !r.meta.changes) throw new Refus(410, "Ce code promo a déjà été utilisé par le nombre maximum de lecteurs.");
      fin = t + Math.round(row.jours * JOUR);
      await db.prepare("INSERT OR REPLACE INTO activations (code, appareil, debut, fin) VALUES (?, ?, ?, ?)").bind(code, appareil, t, fin).run();
    }
  } else {
    // Code personnel : la durée part de la première utilisation.
    if (!row.debut) {
      await db.prepare("UPDATE codes SET debut = ?, fin = ?, utilises = 1 WHERE code = ? AND debut IS NULL").bind(t, t + Math.round(row.jours * JOUR), code).run();
    }
    const a = await db.prepare("SELECT debut, fin FROM codes WHERE code = ?").bind(code).first();
    fin = a.fin;
    if (fin <= t) throw new Refus(410, "Ce code a expiré. Écrivez-nous sur WhatsApp pour prolonger votre lecture.");
    if (!deja) {
      const n = await db.prepare("SELECT COUNT(*) AS n FROM activations WHERE code = ?").bind(code).first();
      if ((n && n.n || 0) >= APPAREILS_MAX) throw new Refus(403, "Ce code est déjà utilisé sur " + APPAREILS_MAX + " appareils. Écrivez-nous sur WhatsApp si c'est bien le vôtre.");
      await db.prepare("INSERT INTO activations (code, appareil, debut, fin) VALUES (?, ?, ?, ?)").bind(code, appareil, t, fin).run();
    }
  }
  const jeton = await signer({ s: "lecteur", c: code, a: appareil, f: fin }, env);
  return json({ jeton, fin, type: row.type, formule: row.type === "promo" ? "Code promo" : (FORMULES[row.type] || {}).nom || "" });
}

async function compter(db, livre, n, appareil) {
  const r = await db.prepare("SELECT emoji, COUNT(*) AS n FROM reactions WHERE livre = ? AND n = ? GROUP BY emoji").bind(livre, n).all();
  const comptes = {}; (r.results || []).forEach(x => { comptes[x.emoji] = x.n; });
  let moi = "";
  if (APPAREIL.test(appareil || "")) { const m = await db.prepare("SELECT emoji FROM reactions WHERE livre = ? AND n = ? AND appareil = ?").bind(livre, n, appareil).first(); moi = m ? m.emoji : ""; }
  return { comptes, moi };
}
async function reactionsGet(url, env) {
  const db = await base(env);
  const livre = String(url.searchParams.get("livre") || ""), n = parseInt(url.searchParams.get("n"), 10);
  if (!ID_LIVRE.test(livre) || !(n >= 1)) return erreur(400, "Chapitre inconnu.");
  return json(await compter(db, livre, n, url.searchParams.get("appareil")));
}
async function reagir(corps, env) {
  const db = await base(env);
  const livre = String(corps.livre || ""), n = parseInt(corps.n, 10), appareil = String(corps.appareil || ""), emoji = String(corps.emoji || "");
  if (!ID_LIVRE.test(livre) || !(n >= 1) || !APPAREIL.test(appareil)) throw new Refus(400, "Réaction refusée.");
  if (emoji && EMOJIS.indexOf(emoji) === -1) throw new Refus(400, "Réaction refusée.");
  const c = await db.prepare("SELECT n FROM chapitres WHERE livre = ? AND n = ?").bind(livre, n).first();
  if (!c) throw new Refus(404, "Ce chapitre n'existe pas.");
  if (emoji) await db.prepare("INSERT OR REPLACE INTO reactions (livre, n, appareil, emoji, t) VALUES (?, ?, ?, ?, ?)").bind(livre, n, appareil, emoji, maintenant()).run();
  else await db.prepare("DELETE FROM reactions WHERE livre = ? AND n = ? AND appareil = ?").bind(livre, n, appareil).run();
  return json(await compter(db, livre, n, appareil));
}
