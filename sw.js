/* ChessArena Service Worker — PWA Offline Support */
const CACHE = 'chessarena-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/chess.js',
  '/about.html',
  '/how-to-play.html',
  '/rules.html',
  '/contact.html',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Network first for PeerJS CDN, cache first for local assets
  const isLocal = new URL(e.request.url).hostname === self.location.hostname;
  e.respondWith(
    isLocal
      ? caches.match(e.request).then(r => r || fetch(e.request).then(res => {
          if (res.ok) { const c = res.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)); }
          return res;
        }))
      : fetch(e.request).catch(() => caches.match(e.request))
  );
});
