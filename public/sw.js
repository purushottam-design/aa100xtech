const CACHE = "aa100x-app-v2";
const SHELL = ["/app/home", "/app-icon-512.png", "/favicon.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => undefined)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/app/home"))),
  );
});

/* ----------------------------------------------------------- notifications */

function show(payload) {
  return self.registration.showNotification(payload.title || "AA100XTech", {
    body: payload.body || "",
    icon: "/app-icon-512.png",
    badge: "/favicon.png",
    tag: payload.id || undefined,
    data: { url: payload.url || "/app/notifications" },
  });
}

// Announcements relayed from the app while it is open.
self.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg && msg.type === "aa-notify" && msg.payload) event.waitUntil(show(msg.payload));
});

// Real web-push payloads (when a push service is attached).
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "AA100XTech", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(show(payload));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/app/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(target) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
