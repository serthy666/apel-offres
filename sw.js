// Mise en cache pour un chargement rapide et un usage hors connexion.
// Changer VERSION à chaque publication (garder le préfixe apel-offres-) pour que les téléphones récupèrent la nouvelle version.
const VERSION = 'apel-offres-v11';
// Indispensables : sans eux, pas d'installation. Les autres sont mis en cache s'ils existent.
const ESSENTIELS = ['index.html', 'donnees.js'];
const SECONDAIRES = ['assets/logo-96.webp', 'assets/logo-192.webp',
  'polices/inter-Regular.woff2', 'polices/inter-SemiBold.woff2', 'polices/inter-ExtraBold.woff2'];

// cache: 'no-cache' : le navigateur revérifie auprès du serveur (réponse 304 légère si rien n'a changé)
// au lieu de reprendre une copie gardée par le navigateur.
const frais = u => new Request(u, { cache: 'no-cache' });

// Une réponse obtenue après une redirection (ex. Cloudflare Pages renvoie /index.html vers /) ne peut pas
// servir de page : le navigateur la refuse. On en garde une copie « propre ».
function propre(r) {
  return r.redirected ? new Response(r.body, { status: r.status, statusText: r.statusText, headers: r.headers }) : r;
}
// La page est demandée à l'adresse du dossier (./), jamais par index.html.
const SOURCE = { 'index.html': './' };
function mettreEnCache(c, u) {
  return fetch(frais(SOURCE[u] || u)).then(r => {
    if (!r.ok) throw new Error(u + ' : ' + r.status);
    return c.put(u, propre(r));
  });
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.all(ESSENTIELS.map(u => mettreEnCache(c, u)))
      .then(() => Promise.all(SECONDAIRES.map(u => mettreEnCache(c, u).catch(() => {})))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  let avantBibliotheque = false;
  e.waitUntil(caches.keys()
    .then(cles => {
      // Versions antérieures à la bibliothèque (v1 à v5) : elles ne connaissent pas les liens ?livre=.
      avantBibliotheque = cles.some(k => /^apel-offres-v[1-5]$/.test(k));
      return Promise.all(cles.filter(k => k.indexOf('apel-offres-') === 0 && k !== VERSION).map(k => caches.delete(k)));
    })
    .then(() => self.clients.claim())
    .then(() => avantBibliotheque ? self.clients.matchAll({ type: 'window' }) : [])
    // Une page ouverte par un lien de livre avec l'ancienne version est rechargée avec la nouvelle.
    .then(fen => Promise.all(fen.filter(c => /[?&]livre=/.test(c.url)).map(c => c.navigate(c.url).catch(() => {})))));
});

function estPageAppli(url) {
  const racine = new URL('./', self.registration.scope).pathname;
  return url.pathname === racine || url.pathname === racine + 'index.html';
}

let retire = false;

// N'enregistre qu'une réponse correcte et du bon type (jamais une page d'erreur ou une image à la place de la page).
function garder(cle, r, type) {
  if (!retire && r && r.ok && (r.headers.get('content-type') || '').indexOf(type) !== -1) {
    const copie = propre(r.clone());
    caches.open(VERSION).then(c => retire ? null : c.put(cle, copie));
  }
}

// La redirection mène-t-elle vers une autre adresse (autre nom de domaine) qui répond (certificat, https) ?
// Une redirection interne à l'hébergeur (ex. /index.html vers /) aboutit sur la même origine : on l'ignore.
// Si la nouvelle adresse ne répond pas, on garde la copie actuelle et on réessaiera à la visite suivante.
function redirectionValide(url) {
  return fetch(url, { mode: 'no-cors', cache: 'no-store' }).then(r => r.type === 'opaque', () => false);
}

// Si l'adresse de l'appli redirige ailleurs (passage à un nom de domaine), ce service worker se retire
// et recharge les pages ouvertes : les visiteurs suivent alors la redirection au lieu de garder l'ancienne copie.
function effacerCaches() {
  return caches.keys().then(cles => Promise.all(cles.filter(k => k.indexOf('apel-offres-') === 0).map(k => caches.delete(k))));
}
function quitter(e, servieDuCache) {
  retire = true;
  // La page servie depuis le cache existera bientôt : on l'attend 5 s au plus. Sinon, le navigateur suit déjà la redirection.
  const page = servieDuCache && e.resultingClientId
    ? Promise.race([self.clients.get(e.resultingClientId), new Promise(r => setTimeout(r, 5000))]) : null;
  return self.registration.unregister()
    .then(effacerCaches)
    .then(() => Promise.all([self.clients.matchAll({ type: 'window' }), page]))
    .then(([fen, p]) => {
      if (p && !fen.some(c => c.id === p.id)) fen.push(p);
      return Promise.all(fen.map(c => c.navigate(c.url.replace(/#.*$/, '')).catch(() => {})));
    })
    // Seconde passe : une copie en cours d'écriture au moment du retrait ne doit pas survivre.
    .then(effacerCaches);
}

// Cache d'abord (affichage immédiat), puis mise à jour en arrière-plan pour la visite suivante.
// La réponse n'attend jamais le traitement d'une redirection.
function cacheDAbord(e, cle, type) {
  const req = e.request.mode === 'navigate' ? e.request : new Request(e.request, { cache: 'no-cache' });
  const enCache = caches.match(cle);
  const reseau = fetch(req).then(r => { garder(cle, r, type); return r; });
  e.waitUntil(Promise.all([reseau, enCache]).then(([r, copie]) => {
    if (cle === 'index.html' && r.type === 'opaqueredirect') {
      return redirectionValide(e.request.url).then(ok => ok ? quitter(e, !!copie) : null);
    }
  }).catch(() => {}));
  return enCache.then(copie => copie || reseau);
}

// Page relais d'un lien partagé (/l/<code> livre, /o/<code> offre) : hors connexion, on ouvre directement l'appli.
function adresseHorsLigne(url) {
  const m = url.pathname.match(/\/(l|o)\/([^/]+)\/?$/);
  if (!m) return null;
  const p = new URLSearchParams(url.search);
  if (!p.has('src')) p.set('src', 'partage');
  p.set(m[1] === 'l' ? 'livre' : 'pack', decodeURIComponent(m[2]));
  return new URL('./?' + p.toString(), self.registration.scope).href;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    const horsLigne = adresseHorsLigne(url);
    if (horsLigne) { e.respondWith(fetch(req).catch(() => Response.redirect(horsLigne, 302))); return; }
    if (estPageAppli(url)) e.respondWith(cacheDAbord(e, 'index.html', 'text/html'));
    else e.respondWith(fetch(req).catch(() => caches.match('index.html')));
    return;
  }
  if (url.pathname.endsWith('/donnees.js')) {
    e.respondWith(cacheDAbord(e, 'donnees.js', 'javascript'));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    // Jamais une page HTML à la place d'un fichier (Cloudflare répond par la page d'accueil quand un fichier manque).
    const html = (res.headers.get('content-type') || '').indexOf('text/html') !== -1;
    if (!retire && res.ok && res.type === 'basic' && !html) { const copie = propre(res.clone()); caches.open(VERSION).then(c => retire ? null : c.put(req, copie)); }
    return res;
  })));
});
