/* Minimal service worker. Browsers want one before they treat a site as an installable app; this one caches nothing, so every request goes to
   the network and a new deploy is what the visitor sees. It lives at the site root so its scope covers every screen.
   If you later want offline use, add a cache here and bump a version string so old caches are removed. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) { e.respondWith(fetch(e.request).catch(function () { return Response.error(); })); });
