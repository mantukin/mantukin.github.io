const LEGACY_CACHE_NAMES = ["widget-runtime-v1"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => LEGACY_CACHE_NAMES.includes(key))
          .map((key) => caches.delete(key))
      );
      await self.registration.unregister();
    })()
  );
});
