const CACHE_NAME = 'rng-tool-v2';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon.png',
    './apple-touch-icon.png'
];

// インストール時にファイルをキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell and assets');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting()) // 即座に待機状態をスキップしてアクティブにする
    );
});

// アクティベート時に古いキャッシュをクリーンアップ
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // 制御下にあるすべてのクライアントを即座に制御開始
    );
});

// フェッチ要求に対するキャッシュファースト戦略
self.addEventListener('fetch', (event) => {
    // APIリクエストはキャッシュせずパススルー
    if (event.request.url.includes('/api/')) {
        return;
    }

    // 外部APIなどのリクエストはキャッシュしない（基本的にはすべてローカルだが念のため）
    if (event.request.mode === 'navigate' || event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((response) => {
                    // レスポンスが正常かつ有効な場合のみキャッシュに追加（動的アセット用）
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                }).catch(() => {
                    // オフラインかつキャッシュにない場合のフォールバック（ここでは単純にエラーを返す）
                });
            })
        );
    }
});