const CACHE_NAME = 'mtnspec-v-20261104_191000';
const urlsToCache = [
    './app.html',
    './app.css',
    './app.js',
    './app-icon.png',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Bypass Service Worker interception for streaming video / Range requests
    if (event.request.headers.has('range') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(event.request.url)) {
        return;
    }

    // Always use Network-First for HTML pages, CSS and site-config.js so mtnspec.co.zw updates immediately
    if (
        event.request.mode === 'navigate' ||
        (event.request.headers.get('accept') || '').includes('text/html') ||
        event.request.url.includes('corporate.css') ||
        event.request.url.includes('corporate.js') ||
        event.request.url.includes('site-config.js')
    ) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-First for static app assets (offline support for Change It PWA)
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseToCache));
                    return response;
                });
            })
    );
});
