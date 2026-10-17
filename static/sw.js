/*
 * Caches the versioned three.js modules (cache-first; the URL pins the version)
 * and /images/ + /models/ (stale-while-revalidate, so a repeat visit is served
 * from disk without waiting on the network). Bump VERSION to invalidate. HTML,
 * CSS and the JS bundle stay with the browser's HTTP cache: the stylesheets are
 * not fingerprinted, so a stale one could pair with a fresh page.
 */
const VERSION = '1';

const IMMUTABLE_CACHE = `immutable-v${VERSION}`;
const ASSET_CACHE = `assets-v${VERSION}`;
const CACHE_NAMES = [IMMUTABLE_CACHE, ASSET_CACHE];

const THREE_ORIGIN = 'https://unpkg.com';
const ASSET_PREFIXES = ['/images/', '/models/'];

self.addEventListener('install', (event) => {
    // Nothing is pre-fetched; an asset is cached the first time it is asked for.
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        try {
            const names = await caches.keys();
            await Promise.all(
                names
                    .filter((name) => !CACHE_NAMES.includes(name))
                    .map((name) => caches.delete(name))
            );
        } catch (e) { /* leave the caches alone */ }
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET') return;
    if (request.headers.has('range')) return;

    let url;
    try {
        url = new URL(request.url);
    } catch (e) {
        return;
    }

    if (isThreeModule(url)) {
        event.respondWith(cacheFirst(request, IMMUTABLE_CACHE));
        return;
    }

    if (isSiteAsset(url)) {
        event.respondWith(staleWhileRevalidate(request, ASSET_CACHE, event));
    }
});

function isThreeModule(url) {
    return url.origin === THREE_ORIGIN && url.pathname.startsWith('/three@');
}

function isSiteAsset(url) {
    return url.origin === self.location.origin &&
        ASSET_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

// Opaque responses cannot be inspected, so a failure looks like a success.
function isCacheable(response) {
    if (!response) return false;
    if (response.status !== 200) return false;
    return response.type === 'basic' || response.type === 'cors';
}

// Private windows can refuse storage; callers then fall back to the network.
async function openCache(name) {
    try {
        return await caches.open(name);
    } catch (e) {
        return null;
    }
}

async function cacheFirst(request, cacheName) {
    const cache = await openCache(cacheName);

    if (cache) {
        const cached = await cache.match(request).catch(() => null);
        if (cached) return cached;
    }

    const response = await fetch(request);

    if (cache && isCacheable(response)) {
        await cache.put(request, response.clone()).catch(() => {});
    }

    return response;
}

async function staleWhileRevalidate(request, cacheName, event) {
    const cache = await openCache(cacheName);

    const revalidate = fetch(request)
        .then(async (response) => {
            if (cache && isCacheable(response)) {
                await cache.put(request, response.clone()).catch(() => {});
            }
            return response;
        })
        .catch(() => null);

    if (!cache) return (await revalidate) || Response.error();

    const cached = await cache.match(request).catch(() => null);

    if (cached) {
        event.waitUntil(revalidate);
        return cached;
    }

    return (await revalidate) || Response.error();
}
