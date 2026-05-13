const CACHE_NAME = 'exclusive-decor-v2';
// Archivos básicos para que la web abra
const assets = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './data.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// La magia: Captura TODO (incluidas las imágenes nuevas)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Si está en la memoria, lo devuelve volando
      }

      // Si no está en memoria, lo busca en internet y lo GUARDA para la próxima
      return fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
