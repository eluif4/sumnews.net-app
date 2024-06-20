// // Install the service worker
// self.addEventListener('install', (event) => {
//     event.waitUntil(
//         caches.open('my-app-cache').then((cache) => {
//             return cache.addAll([
//                 '/',
//                 '/index.html',
//                 '/styles.css',
//                 '/script.js',
//                 // Add other resources you want to cache here
//             ]);
//         })
//     );
// });

// // Activate the service worker
// self.addEventListener('activate', (event) => {
//     event.waitUntil(
//         caches.keys().then((cacheNames) => {
//             return Promise.all(
//                 cacheNames
//                     .filter((cacheName) => cacheName !== 'my-app-cache')
//                     .map((cacheName) => caches.delete(cacheName))
//             );
//         })
//     );
// });

// // Fetch event
// self.addEventListener('fetch', (event) => {
//     event.respondWith(
//         caches.match(event.request).then((response) => {
//             return response || fetch(event.request);
//         })
//     );
// });

// Install the service worker
self.addEventListener('install', (event) => {
    // You can skip waiting to activate the service worker immediately
    self.skipWaiting();
});

// Activate the service worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        })
    );
    // Claim control immediately so that the service worker starts controlling the pages
    return self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});