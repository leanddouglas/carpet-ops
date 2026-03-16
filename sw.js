/**
 * sw.js — Service Worker for Carpet & Tile Ops PWA
 * Enables offline-first usage on Android, iOS, Windows, macOS
 */

const CACHE_NAME = 'cto-v1.0';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/data.js',
    './js/dashboard.js',
    './js/ledger.js',
    './js/tracker.js',
    './js/tax.js',
    './js/settings.js',
    './js/app.js',
    './assets/icon-192.png',
    './assets/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
];

// Install: cache all assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })));
        }).then(() => self.skipWaiting())
    );
});

// Activate: clear old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: serve from cache, fallback to network, then cache-first for offline
self.addEventListener('fetch', event => {
    // Skip non-GET and chrome-extension requests
    if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Return the cached index.html for navigation requests when offline
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
