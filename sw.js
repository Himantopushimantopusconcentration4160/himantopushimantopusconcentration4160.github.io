/* 다꾸 체험단 모음 - 오프라인/빠른 실행용 서비스워커 */
const V = "dakku-v1";
const CORE = ["./", "index.html", "style.css", "app.js", "manifest.webmanifest", "icons/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // 숙소 사진: 캐시 우선
  if (u.pathname.includes("/images/") || u.pathname.includes("/icons/")) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp)); return res; })));
    return;
  }
  // 그 외(목록 data.json, 페이지): 네트워크 우선, 오프라인이면 캐시
  e.respondWith(fetch(e.request).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(e.request.url.split("?")[0], cp)); return res; })
    .catch(() => caches.match(e.request.url.split("?")[0]).then(r => r || caches.match("index.html"))));
});
