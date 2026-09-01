const CACHE_VERSION = "jslichot-v3";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL_URLS = ["/", "/offline", "/manifest.webmanifest", "/brand/poster-placeholder.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("jslichot-") && key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Never intercept map tiles / Google APIs / video streams / cross-origin requests.
function isSameOrigin(url) {
  return new URL(url).origin === self.location.origin;
}

// Only cache-first truly static, content-hashed or clearly non-personalized
// assets. Every app *page* route (/, /tour, /start, /station/[slug]...) is
// dynamic and session-cookie-dependent — Next.js's client-side <Link>
// navigation issues plain `fetch()` calls (not `navigate` mode) to those
// same URLs to pull the RSC payload, and a cache-first strategy on those
// would happily serve back a stale response from before the visitor had a
// tour session (e.g. a "no session yet" redirect), permanently breaking
// navigation until the cache is cleared. Static assets have none of that
// risk, so they're the only thing safe to cache-first here.
function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/backgrounds/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isSameOrigin(request.url)) return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((res) => res || caches.match("/")))
    );
    return;
  }

  // Any non-navigate, non-static request (page prefetches, RSC data fetches
  // for app routes, etc.) is left completely untouched — straight to the
  // network, every time, so personalized/dynamic content is never served
  // stale from cache.
  if (!isStaticAsset(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
