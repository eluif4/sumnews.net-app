const CACHE_KEY = 'site-static-v1';
const assets = [
    "/",
    "/index.html",
    "/src/main.js",
    "/src/assets/icons/sumnews.net_banner.png",
    "/src/global.css",
    "/src/App.vue",
    "/src/router/index.js",
    "https://fonts.googleapis.com/css2?family=Alef&family=Bitter&display=swap",
    "https://fonts.gstatic.com/s/alef/v21/FeVfS0NQpLYgnjdRCqFx.woff2",
];

// Install the service worker
self.addEventListener('install', (event) => {
    event.waitUntil( // Waits for assets to be cached before sw.js in installed
        caches.open(CACHE_KEY).then((cache) => {
            console.log('caching shell assets');
            cache.addAll(assets);
        })
    );
});

// Activate the service worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys
                .filter((key) => key !== CACHE_KEY)
                .map((key) => caches.delete(key))
            );
        }
        ));
});

// Fetch event
self.addEventListener('fetch', (event) => {
    const requestURL = new URL(event.request.url);

    // event.respondWith(
    //     // Responds with cached assets if available
    //     caches.match(event.request).then((response) => {
    //         return response || fetch(event.request); // If caches is empty, fetch from network
    //     })
    // )

    // Bypass the service worker for requests to specific domains
    if (requestURL.origin === 'https://pagead2.googlesyndication.com') {
        return;  // Let the browser handle these requests directly
    }
});