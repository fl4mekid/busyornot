const CACHE_NAME = 'busyornot-v1.3';
const BASE_PATH = '/busyornot';
const ASSETS_TO_CACHE = [
    '/busyornot/',
    '/busyornot/index.html',
    '/busyornot/css/special.css',
    '/busyornot/css/output.css',
    '/busyornot/js/script.js',
    '/busyornot/manifest.json',
    '/busyornot/images/busyornot192.png',
    '/busyornot/images/busyornot512.png',
    '/busyornot/images/screenshot-desktop.png',
    '/busyornot/images/screenshot-mobile.png',
    '/busyornot/images/favicon.png'
];

// CDN Kaynakları
const CDN_URLS = [
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://apis.google.com'
];

// Service Worker Kurulumu
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching:', ASSETS_TO_CACHE);
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

// Aktif Olma
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => {
                            console.log('[ServiceWorker] Eski önbellek siliniyor:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
        ])
    );
});

// CDN URL kontrolü
function isCDNUrl(url) {
    return CDN_URLS.some(cdnUrl => url.includes(cdnUrl));
}

// API URL kontrolü
function isAPIUrl(url) {
    return url.includes('googleapis.com/calendar');
}

// Fetch İsteklerini Yakalama
self.addEventListener('fetch', (event) => {
    // API isteklerini bypass et
    if (event.request.url.includes('googleapis.com/calendar')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request.clone())
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[ServiceWorker] Fetch hatası:', error);
                        if (event.request.mode === 'navigate') {
                            return caches.match('/busyornot/index.html');
                        }
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});