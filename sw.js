const CACHE_NAME = 'exclusive-decor-v1';
const assets = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './data.js',
  './manifest.json',
  // Aquí tendrías que añadir las rutas de las fotos si quieres que se guarden todas
];

// Instalar el Service Worker y guardar archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Responder desde la caché cuando no haya internet
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
