const CACHE_NAME = 'busyornot-v1.1';
const BASE_PATH = '/busyornot';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/special.css',
    '/css/output.css',
    '/js/script.js',
    '/manifest.json',
    '/images/busyornot192.png',
    '/images/busyornot512.png',
    '/images/screenshot-desktop.png',
    '/images/screenshot-mobile.png',
    '/images/favicon.png'
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
                const urlsToCache = ASSETS_TO_CACHE.map(url => BASE_PATH + url);
                console.log('[ServiceWorker] Caching:', urlsToCache);
                return cache.addAll(urlsToCache);
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
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return new Response(JSON.stringify({ items: [] }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
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
                        // Offline durumunda ana sayfaya yönlendir
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