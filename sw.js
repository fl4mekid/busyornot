const CACHE_NAME = 'busyornot-v1.4';
const BASE_PATH = '/busyornot';

// Güvenli kaynaklar
const SECURE_ORIGINS = [
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://apis.google.com'
];

// Önbelleğe alınacak kaynaklar
const ASSETS_TO_CACHE = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/css/special.css`,
    `${BASE_PATH}/css/output.css`,
    `${BASE_PATH}/js/script.js`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/images/busyornot192.png`,
    `${BASE_PATH}/images/busyornot512.png`,
    `${BASE_PATH}/images/screenshot-desktop.png`,
    `${BASE_PATH}/images/screenshot-mobile.png`,
    `${BASE_PATH}/images/favicon.png`
];

// Güvenli kaynak kontrolü
function isSecureOrigin(url) {
    try {
        const origin = new URL(url).origin;
        return SECURE_ORIGINS.some(secureOrigin => origin.includes(secureOrigin));
    } catch (e) {
        return false;
    }
}

// API URL kontrolü
function isAPIUrl(url) {
    return url.includes('googleapis.com/calendar');
}

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

// Fetch İsteklerini Yakalama
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // API isteklerini bypass et
    if (isAPIUrl(url)) {
        return;
    }

    // Güvenli olmayan kaynakları engelle
    if (!isSecureOrigin(url) && !url.startsWith(self.location.origin)) {
        event.respondWith(new Response('Güvenli olmayan kaynak engellendi', {
            status: 403,
            statusText: 'Forbidden'
        }));
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
                            return caches.match(`${BASE_PATH}/index.html`);
                        }
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});