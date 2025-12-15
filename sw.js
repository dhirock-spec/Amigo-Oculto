// Service Worker básico para permitir instalação PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Limpar caches antigos se necessário no futuro
});

self.addEventListener('fetch', (event) => {
  // Pass-through simples. 
  // Para um app completo offline, aqui iria a lógica de cache.
  event.respondWith(fetch(event.request));
});