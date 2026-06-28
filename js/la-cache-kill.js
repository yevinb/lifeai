/* Cache killer — runs on index + dashboard to fix stuck old service workers */
(function () {
  var KEY = 'lifeai_cache_fixed_v21';
  if (sessionStorage.getItem(KEY)) return;

  function done() {
    sessionStorage.setItem(KEY, '1');
    if (!location.search.includes('fresh=1')) {
      var u = location.pathname + '?fresh=1' + location.hash;
      location.replace(u);
    }
  }

  var steps = [];
  if ('serviceWorker' in navigator) {
    steps.push(
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      })
    );
  }
  if ('caches' in window) {
    steps.push(
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
    );
  }

  if (steps.length) {
    Promise.all(steps).then(done).catch(done);
  }
})();
