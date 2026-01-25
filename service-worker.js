const CACHE_NAME = 'cron-game-v12';

// Use absolute URLs resolved from the service worker location
const BASE_PATH = self.location.pathname.replace(/\/[^\/]+$/, '/');
const urlsToCache = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'style.css',
    BASE_PATH + 'game.js',
    BASE_PATH + 'icon-192.png',
    BASE_PATH + 'icon-512.png',
    BASE_PATH + 'manifest.json'
];

// Install service worker and cache assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files:', urlsToCache);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: All files cached');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('Service Worker: Cache failed:', err);
            })
    );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Claiming clients');
            return self.clients.claim();
        })
    );
});

// Serve from cache first, fallback to network
self.addEventListener('fetch', event => {
    // Only handle same-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Network First strategy for navigation requests (HTML)
    // This ensures we always get the latest version if online
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache the latest version
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Cache First for everything else (Assets)
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(response => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response for caching
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
            })
    );
});
