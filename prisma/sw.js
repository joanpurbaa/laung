const CACHE_NAME = "laung-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Laung", body: event.data.text() };
  }

  const options = {
    body: payload.body ?? "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: payload.tag ?? "laung-notif",
    renotify: true,
    requireInteraction: payload.requireInteraction ?? false,
    data: {
      url: payload.url ?? "/dashboard",
      timestamp: Date.now(),
    },
    actions: payload.actions ?? [],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Laung", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/dashboard";

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
      })
  );
});