const CACHE_NAME = "idleshroom-v54";
const ASSETS = [
  "./",
  "./index.html",
  "./suite-header.css",
  "./styles.css",
  "./game.js",
  "./ads-config.js",
  "./online-config.js",
  "./ads.js",
  "./icon.svg",
  "./marks/ao-ink.svg",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./sprites/glade-premium.svg",
  "./sprites/shroom-premium.svg",
  "./manifest.webmanifest",
  "./about.html",
  "./privacy.html"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  const path = requestUrl.pathname;
  const networkFirst = event.request.mode === "navigate"
    || path.endsWith(".html")
    || path.endsWith(".css")
    || path.endsWith(".js")
    || path.endsWith("/online-config.js");

  if (networkFirst) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match("./index.html")))
  );
});
