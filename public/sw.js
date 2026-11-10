const CACHE_NAME = "laung-v2";
const MAP_TILE_CACHE = "laung-map-tiles-v1";
const API_CACHE = "laung-api-cache-v1";
const STATIC_CACHE = "laung-static-v1";

const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/map",
  "/history",
  "/profile",
  "/icon.svg",
  "/maskot.webp",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("SW: Warning precaching static assets:", err);
      });
    }),
  );
});

self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_NAME, MAP_TILE_CACHE, API_CACHE, STATIC_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (!currentCaches.includes(name)) {
              return caches.delete(name);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Hanya proses GET requests
  if (request.method !== "GET") return;

  // 1. STRATEGI CACHE-FIRST: Map Tiles (OpenStreetMap)
  if (
    url.hostname.includes("tile.openstreetmap.org") ||
    url.pathname.endsWith(".png") && url.pathname.includes("/tile/")
  ) {
    event.respondWith(
      caches.open(MAP_TILE_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            void cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (fetchErr) {
          // Jika offline dan tile belum ada di cache, kirimkan fallback transparan 1x1
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#0f172a" fill-opacity="0.08"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="sans-serif">Peta Offline</text></svg>',
            {
              headers: { "Content-Type": "image/svg+xml" },
              status: 200,
            },
          );
        }
      }),
    );
    return;
  }

  // 2. STRATEGI NETWORK-FIRST DENGAN CACHE FALLBACK: Data Satelit & Cuaca API
  if (
    url.pathname.startsWith("/api/zppi") ||
    url.pathname.startsWith("/api/chlorophyll") ||
    url.pathname.startsWith("/api/sst") ||
    url.pathname.startsWith("/api/tides") ||
    url.pathname.startsWith("/api/weather")
  ) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            void cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            JSON.stringify({ error: "Offline: Data lokal tidak ditemukan" }),
            {
              headers: { "Content-Type": "application/json" },
              status: 503,
            },
          );
        }
      }),
    );
    return;
  }

  // 3. STRATEGI STALE-WHILE-REVALIDATE: Asset Statis (CSS, JS, Fonts, Images)
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              void cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      }),
    );
    return;
  }

  // 4. Default: Network dengan fallback ke cache untuk navigasi halaman
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const match = await cache.match(request);
        return match || cache.match("/dashboard");
      }),
    );
  }
});

// ── PUSH NOTIFICATION SYSTEM ──────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Laung Maritim", body: event.data.text() };
  }

  const isEmergency =
    (payload.tag && payload.tag.includes("sos")) ||
    (payload.title && payload.title.includes("SOS"));

  const options = {
    body: payload.body ?? "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: payload.tag ?? "laung-notif",
    renotify: true,
    requireInteraction: isEmergency || (payload.requireInteraction ?? false),
    vibrate: isEmergency ? [300, 100, 300, 100, 500] : [100, 50, 100],
    data: {
      url: payload.url ?? "/map",
      timestamp: Date.now(),
      emergency: isEmergency,
    },
    actions: payload.actions ?? [
      { action: "view", title: "Buka Peta & Radar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Laung Maritim", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/map";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            void client.focus();
            void client.navigate(targetUrl);
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
