/* Only a public error shell and brand icons enter Cache Storage. */
const CACHE_PREFIX = "axia-pwa-public-";
const CACHE_NAME = CACHE_PREFIX + "__AXIA_RELEASE__";
const PUBLIC_ASSETS = ["/offline.html", "/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/maskable-512.png", "/pwa/apple-touch-icon.png"];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const path of PUBLIC_ASSETS) {
      // Preserve same-origin deployment protection; only these public responses enter the cache.
      const request = new Request(new URL(path, self.location.origin), { cache: "reload", credentials: "same-origin", redirect: "error" });
      const response = await fetch(request);
      const expected = path.endsWith(".html") ? "text/html" : "image/png";
      if (!response.ok || response.redirected || !response.headers.get("content-type")?.startsWith(expected)) throw new Error("Public shell unavailable");
      await cache.put(request.url, response);
    }
  })());
  // An update waits for the user's explicit choice; no automatic skipWaiting.
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) await caches.delete(name);
    await self.clients.claim();
  })());
});
self.addEventListener("message", event => {
  if (event.data?.type !== "AXIA_ACTIVATE_UPDATE" || !event.source?.url) return;
  if (new URL(event.source.url).origin === self.location.origin) void self.skipWaiting();
});
self.addEventListener("fetch", event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Never intercept APIs, callbacks or framework requests. Failed writes are never replayed.
  if (["/api", "/auth", "/_next"].some(path => url.pathname === path || url.pathname.startsWith(path + "/"))) return;
  if (!url.search && PUBLIC_ASSETS.includes(url.pathname)) {
    event.respondWith((async () => (await (await caches.open(CACHE_NAME)).match(url.href)) || fetch(request))());
  } else if (request.mode === "navigate") {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch { return (await (await caches.open(CACHE_NAME)).match(new URL("/offline.html", self.location.origin).href)) || Response.error(); }
    })());
  }
});

// Persistent system notifications work on supported mobile browsers. Push enrollment/sending is not enabled here.
self.addEventListener("push", event => {
  // Ignore payload contents: legal records and attacker-supplied destinations never reach the lock screen.
  event.waitUntil(self.registration.showNotification("AXIA Legal · تحديث من مساحة العمل", {
    body: "لديك تحديث جديد. افتح مساحة العمل للاطلاع عليه.",
    icon: "/pwa/icon-192.png", badge: "/pwa/icon-192.png", tag: "axia-workspace-reminder",
    dir: "rtl", lang: "ar", data: { path: "/?workspace=1" },
  }).catch(() => {}));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = new URL("/?workspace=1", self.location.origin).href;
    for (const client of await self.clients.matchAll({ type: "window", includeUncontrolled: true })) {
      try {
        if (new URL(client.url).origin === self.location.origin) { await client.focus(); return; }
      } catch { /* Try another window; never navigate an unsaved editor. */ }
    }
    await self.clients.openWindow(target);
  })());
});
