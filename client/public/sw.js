const CACHE_NAME = 'cafe-pos-v1';
const RUNTIME_CACHE = 'cafe-pos-runtime-v1';

// App shell - critical files for offline UI
const APP_SHELL = [
    '/',
    '/index.html',
    '/offline.html'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return cache.addAll(APP_SHELL);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network-first strategy for API, cache-first for assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // API requests - always network, no cache
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({ error: 'Offline - API unavailable' }),
                    {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            })
        );
        return;
    }

    // Static assets - cache first, fallback to network
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request)
                .then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }

                    // Clone response for caching
                    const responseToCache = response.clone();

                    // Cache static assets
                    if (
                        url.protocol.startsWith('http') &&
                        url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)
                    ) {
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }

                    return response;
                })
                .catch(() => {
                    // Offline fallback for HTML pages
                    if (request.headers.get('accept').includes('text/html')) {
                        return caches.match('/offline.html');
                    }
                });
        })
    );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    // Future: Handle offline order queue
});
