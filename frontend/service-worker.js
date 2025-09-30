// Nombre de la caché para que sepa qué archivos está guardando.
const CACHE_NAME = 'anahi-v1';
// Lista de archivos a precachear (App Shell)
const urlsToCache = [
  '/', 
  '/index.html', 
  '/styles.css', 
  // Librería de iconos que usa tu HTML
  'https://unpkg.com/lucide@latest', 
  
  // Rutas de tus íconos
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Evento: Instalación del Service Worker
self.addEventListener('install', event => {
  // Asegura que el service worker se instale y cachee todos los recursos
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and pre-cached files');
        // Agregar los archivos listados a la caché
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache files during install:', err);
      })
  );
});

// Evento: Fetch (Cada vez que la aplicación intenta obtener un recurso)
self.addEventListener('fetch', event => {
  // Estrategia: Cache-First. Intenta servir el recurso desde la caché.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si hay una respuesta en caché, la devuelve inmediatamente
        if (response) {
          return response;
        }
        
        // Si no está en caché, va a la red (servidor)
        return fetch(event.request);
      })
  );
});

// Evento: Activación (Limpia cachés antiguas)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  // Limpia cachés antiguas (si cambiaste el nombre de CACHE_NAME, ej: 'anahi-v2')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});