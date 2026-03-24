const WIDGET_CACHE_NAME = "widget-runtime-v1";
const WIDGET_HOSTS = new Set([
  "github-profile-summary-cards.vercel.app",
  "streak-stats.demolab.com",
]);

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function isWidgetRequest(request) {
  if (!request || request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);
  return WIDGET_HOSTS.has(url.hostname);
}

function createWidgetCacheKey(urlValue) {
  const url = new URL(urlValue, self.location.origin);
  url.searchParams.delete("v");
  return url.toString();
}

async function fetchAndCacheWidget(requestOrUrl, cache) {
  const request =
    typeof requestOrUrl === "string"
      ? new Request(requestOrUrl, {
          mode: "no-cors",
          credentials: "omit",
          cache: "no-store",
        })
      : requestOrUrl;

  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) {
    await cache.put(createWidgetCacheKey(request.url), response.clone());
  }

  return response;
}

async function handleWidgetRequest(event) {
  const cache = await caches.open(WIDGET_CACHE_NAME);
  const cacheKey = createWidgetCacheKey(event.request.url);
  const cached = await cache.match(cacheKey);
  const networkUpdate = fetchAndCacheWidget(event.request, cache).catch(() => null);

  if (cached) {
    event.waitUntil(networkUpdate);
    return cached;
  }

  const network = await networkUpdate;
  return network || Response.error();
}

async function warmWidgetCache(urls) {
  const cache = await caches.open(WIDGET_CACHE_NAME);
  await Promise.all(
    urls
      .filter((url) => {
        try {
          return WIDGET_HOSTS.has(new URL(url, self.location.origin).hostname);
        } catch {
          return false;
        }
      })
      .map((url) => fetchAndCacheWidget(url, cache).catch(() => null))
  );
}

self.addEventListener("fetch", (event) => {
  if (!isWidgetRequest(event.request)) {
    return;
  }

  event.respondWith(handleWidgetRequest(event));
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "warm-widget-cache" || !Array.isArray(data.urls) || !data.urls.length) {
    return;
  }

  if (typeof event.waitUntil === "function") {
    event.waitUntil(warmWidgetCache(data.urls));
    return;
  }

  warmWidgetCache(data.urls);
});
