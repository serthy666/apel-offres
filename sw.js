// Mise en cache pour un chargement rapide et un usage hors connexion.
// Changer VERSION à chaque publication pour que les téléphones récupèrent la nouvelle version.
const VERSION = 'apel-offres-v3';
const BASE = ['index.html', 'donnees.js', 'assets/logo-96.webp', 'assets/logo-192.webp',
  'polices/inter-Regular.woff2', 'polices/inter-SemiBold.woff2', 'polices/inter-ExtraBold.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function estPageAppli(url) {
  const racine = new URL('./', self.registration.scope).pathname;
  return url.pathname === racine || url.pathname === racine + 'index.html';
}

// N'enregistre qu'une réponse correcte et du bon type (jamais une page d'erreur ou une image à la place de la page).
function garder(cle, r, type) {
  if (r && r.ok && (r.headers.get('content-type') || '').indexOf(type) !== -1) {
    const copie = r.clone();
    caches.open(VERSION).then(c => c.put(cle, copie));
  }
}

// Cache d'abord (affichage immédiat), puis mise à jour en arrière-plan pour la visite suivante.
function cacheDAbord(e, cle, type) {
  const reseau = fetch(e.request).then(r => { garder(cle, r, type); return r; });
  e.waitUntil(reseau.then(() => {}, () => {}));
  return caches.match(cle).then(enCache => enCache || reseau);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    if (estPageAppli(url)) e.respondWith(cacheDAbord(e, 'index.html', 'text/html'));
    else e.respondWith(fetch(req).catch(() => caches.match('index.html')));
    return;
  }
  if (url.pathname.endsWith('/donnees.js')) {
    e.respondWith(cacheDAbord(e, 'donnees.js', 'javascript'));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok && res.type === 'basic') { const copie = res.clone(); caches.open(VERSION).then(c => c.put(req, copie)); }
    return res;
  })));
});
