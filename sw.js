// 作成：06_開発部（Claudeくん） 2026-11-19
// 圏外でも開けるように、画面のファイルをスマホに保存しておく係。
// 先に保存してある版を出して、つながっていれば裏で新しい版を取っておく（次に開いたときに反映）。
const CACHE = 'sokubai-kiroku-0.2.0';
// 画面は './' で保存する（'index.html' は置き場によって転送されることがあり、転送された答えは画面として出せないため）
const FILES = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.search.includes('v=')) return; // 最新版の確認用は素通し
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const key = e.request.mode === 'navigate' ? './' : e.request;
      const hit = await c.match(key, {ignoreSearch: true});
      const net = fetch(e.request).then(res => {
        if (res && res.ok && !res.redirected) c.put(key, res.clone());
        return res;
      }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      const res = await net;
      return res || new Response('圏外で、まだ保存されていない。ネットにつないで一度開いて。', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
    })
  );
});
