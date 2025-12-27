// Music DNA Service Worker
const CACHE_NAME = 'music-dna-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  event.waitUntil(clients.claim());
});

// Fetch event - network first strategy
self.addEventListener('fetch', (event) => {
  // Let the browser handle the request normally for now
  // Can add offline caching later
});
