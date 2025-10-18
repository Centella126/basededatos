// Nombre de la caché
const CACHE_NAME = 'mi-app-cache-v1';
// Archivos a cachear
const urlsToCache = [
  '/', // Representa la raíz (index.html)
  'index.html',
  'styles.css',
  'script.js',
  'login.html',
  'login.css',
  'login.js',
  'icono.png', // Asegúrate de incluir tu ícono si lo guardaste localmente
  'https://unpkg.com/lucide@latest', // Puedes cachear recursos externos también
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta');
        // Agrega todos los archivos definidos a la caché
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercepta las peticiones de red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en caché, lo devuelve desde ahí
        if (response) {
          return response;
        }
        // Si no está en caché, lo pide a la red
        return fetch(event.request);
      })
  );
});

// Activación y limpieza de cachés antiguas (opcional pero recomendado)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Borra cachés viejas
          }
        })
      );
    })
  );
});