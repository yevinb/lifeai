/* LifeAI SW v8 — network first, no stale dashboard */
const CACHE = 'lifeai-v8-2.1';
const SHELL = ['/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (!e.request.url.startsWith(self.location.origin)) return;

  var dest = e.request.destination;
  /* Never serve stale HTML/JS/CSS from cache — always network first */
  if (dest === 'document' || dest === 'script' || dest === 'style') {
    e.respondWith(
      fetch(e.request).then(function (res) {
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (c) {
          return c || caches.match('/index.html');
        });
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request).catch(function () {
      return caches.match(e.request);
    })
  );
});

self.addEventListener('push', function (e) {
  var data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'LifeAI', {
    body: data.body || 'Notification',
    icon: '/icon-192.png'
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(clients.openWindow('/dashboard.html?fresh=1'));
});
