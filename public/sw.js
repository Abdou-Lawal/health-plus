/* Health+ service worker: the app opens offline after one visit online. */
const V = "healthplus-v2";
const SHELL = ["./", "img/hero-heart.svg", "img/stethoscope.svg", "img/health-ui.svg"];
const CDN = /^https:\/\/(www\.gstatic\.com\/firebasejs|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return; // AI calls (POST) always go to the network
  const same = new URL(r.url).origin === location.origin;
  if (CDN.test(r.url)) {
    // Firebase SDK modules and fonts: cache first, fetched once while online.
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => {
      if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); }
      return res;
    })));
  } else if (same) {
    // The app itself: network first (fresh code), cache after 4 s or when offline.
    e.respondWith(Promise.race([fetch(r), new Promise((_, no) => setTimeout(no, 4000))])
      .then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then((hit) => hit || caches.match("./"))));
  }
});
