const CACHE_NAME = 'lifeai-v7';
const ASSETS = [
  '/index.html',
  '/dashboard.html',
  '/about.html',
  '/privacy.html',
  '/manifest.json',
  '/css/lifeai-os.css',
  '/js/finance-pro.js',
  '/js/lifeai-pro.js',
  '/js/lifeai-modules.js',
  '/js/lifeai-briefing.js',
  '/js/lifeai-copilot.js',
  '/js/lifeai-settings.js',
  '/js/lifeai-onboarding.js',
  '/js/lifeai-shell.js',
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first for HTML/JS to get updates faster
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
      }).catch(() => caches.match(e.request).then(c => c || caches.match('/index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request);
    })
  );
});

// ── Push Notifications ────────────────────────────
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'LifeAI';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/dashboard.html' },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || '/dashboard.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
