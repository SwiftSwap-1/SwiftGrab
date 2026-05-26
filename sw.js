/* ============================================================
   SwiftGrab — Service Worker
   Version: 1.0.0 | © 2026 SwiftGrab
   ============================================================ */

const CACHE_NAME = 'swiftgrab-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/youtube.html',
  '/compress.html',
  '/passport.html',
  '/terms.html',
  '/privacy.html',
  '/shared.css',
  '/shared.js',
  '/pwa.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ── Install: cache all static assets ──────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for static, network-first for API ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin API calls (YouTube API etc.)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.')) return;

  // Network-first for HTML pages (always fresh)
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  // Cache-first for CSS, JS, fonts, images
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Return offline fallback for images
        if (request.destination === 'image') {
          return new Response('', { status: 200, statusText: 'OK' });
        }
      });
    })
  );
});

// ── Background sync / push placeholders ───────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
