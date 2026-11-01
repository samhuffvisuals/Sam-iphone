// Offline support for Journey to Clean Fuel.
// The app shell is served from the phone first (works with no WiFi at all),
// then quietly refreshed from the network when one is available.
const CACHE = 'journey-v3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'sw.js', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
const MARK = '<title>Journey to Clean Fuel</title>';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Only keep responses that really are the app. A captive portal (airline or
// hotel WiFi login page) answers every URL with its own page; never cache that.
async function looksGenuine(req, res) {
  if (!res || !res.ok || res.type !== 'basic') return false;
  const url = new URL(req.url);
  const type = (res.headers.get('content-type') || '').toLowerCase();
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    if (!type.includes('text/html')) return false;
    const text = await res.clone().text();
    return text.includes(MARK);
  }
  if (url.pathname.endsWith('.png')) return type.includes('image/');
  if (url.pathname.endsWith('.webmanifest')) return !type.includes('text/html');
  if (url.pathname.endsWith('.js')) return !type.includes('text/html');
  return !type.includes('text/html');
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const isNav = e.request.mode === 'navigate';
  const key = isNav ? './' : e.request;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key, { ignoreSearch: true });
    const refresh = fetch(e.request).then(async res => {
      if (await looksGenuine(e.request, res)) await cache.put(key, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { e.waitUntil(refresh); return cached; }
    const fresh = await refresh;
    if (fresh) return fresh;
    if (isNav) return (await cache.match('./')) || Response.error();
    return Response.error();
  })());
});
