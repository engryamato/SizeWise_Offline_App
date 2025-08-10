self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open('sw-shell-v1').then((c) => c.addAll([
    '/', '/dashboard', '/manifest.webmanifest'
  ])));
});
self.addEventListener('activate', (e) => { self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((resp) => resp || fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open('sw-runtime-v1').then((c) => c.put(e.request, copy));
      return r;
    }).catch(() => resp))
  );
});

