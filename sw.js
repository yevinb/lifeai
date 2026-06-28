const CACHE_NAME = 'lifeai-v8-2.0';
const ASSETS = [
  '/index.html',
  '/dashboard.html',
  '/about.html',
  '/privacy.html',
  '/manifest.json',
  '/css/lifeai-os.css',
  '/css/lifeai-premium.css',
  '/js/finance-pro.js',
  '/js/lifeai-pro.js',
  '/js/lifeai-modules.js',
  '/js/lifeai-briefing.js',
  '/js/lifeai-copilot.js',
  '/js/lifeai-settings.js',
  '/js/lifeai-onboarding.js',
  '/js/lifeai-shell.js',
  '/js/lifeai-premium.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.matchAll()).then(clients => {
      clients.forEach(c => c.postMessage({ type: 'LA_SW_UPDATED', version: '2.0' }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;
  const isDoc = e.request.destination === 'document';
  const isScript = e.request.destination === 'script';
  const isStyle = e.request.destination === 'style';

  if (isDoc || isScript || isStyle) {
    e.respondWith(
      fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('/dashboard.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'LifeAI', {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/dashboard.html' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/dashboard.html';
  e.waitUntil(clients.openWindow(url));
});
