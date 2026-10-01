/**
 * CampusBite - Progressive Web App (PWA) Service Worker
 * Fast caching & offline resilience for campus Wi-Fi environments
 */

const CACHE_NAME = 'campusbite-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/mobile.html',
  '/counter.html',
  '/admin.html',
  '/css/desktop.css',
  '/css/mobile-shell.css',
  '/css/notifications.css',
  '/css/counter.css',
  '/js/api.js',
  '/js/qr-code.js',
  '/js/charts.js',
  '/js/notifications.js',
  '/js/student.js',
  '/js/admin.js',
  '/js/chatbot.js',
  '/js/app.js',
  '/manifest.json'
];

// Install: Cache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some non-critical assets skipped during SW precache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up previous caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first for APIs, cache first with fallback for static files
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always go to network for API calls and SSE streams
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
