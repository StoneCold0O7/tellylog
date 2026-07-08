/* TellyLog service worker, v2.7.0. MINIMAL OFFLINE SHELL by owner
   ruling: the audit-recommended scope. It makes the app installable
   and lets a revisit open offline; it does NOT try to cache the world.
   Rejected direction, on the record: a cache-everything worker, whose
   invalidation risk on a Vercel-deployed SPA with hashed assets buys
   almost nothing (the data already lives in localStorage) at real
   staleness risk.

   Rules:
   - Navigations: network first, cached shell as the offline fallback.
   - Same-origin static assets (the hashed JS/CSS Vite emits, icons):
     cache first, since hashed names never change content.
   - NEVER touches /api/* and never caches cross-origin (TMDB images,
     fonts), so freshness and rate limiting stay honest. */
const SHELL = 'tellylog-shell-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.add('/')).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // TMDB, fonts: untouched
  if (url.pathname.startsWith('/api/')) return;      // health, tmdb proxy, ask: untouched

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
