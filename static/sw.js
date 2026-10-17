/*
 * Service worker: a cache for the heavy, slow-changing assets.
 *
 * The scope is deliberately narrow. Two things are cached:
 *
 *   1. The three.js modules loaded from unpkg. Those URLs carry the version
 *      (three@0.160.0), so they are immutable by construction and can be
 *      served straight from the cache without ever revalidating.
 *
 *   2. Same-origin images and 3D models under /images/ and /models/. Those
 *      use stale-while-revalidate: the cached copy is returned immediately so
 *      the page never waits on the network, and a background request refreshes
 *      the entry for the next visit. A failed background refresh is harmless,
 *      because the cached copy has already been handed to the page.
 *
 * Everything else - HTML, CSS, the JS bundle, the icons from jsdelivr - is
 * left to the browser's own HTTP cache. The stylesheets in particular are not
 * fingerprinted, so storing them here could pair a stale stylesheet with a
 * fresh page.
 *
 * VERSION is the only manual step: bump it to drop every cached copy on the
 * next visit. The image and model filenames are not fingerprinted, so a
 * changed file keeps its name.
 */
const VERSION = '1';

const IMMUTABLE_CACHE = `immutable-v${VERSION}`;
const ASSET_CACHE = `assets-v${VERSION}`;
const CACHE_NAMES = [IMMUTABLE_CACHE, ASSET_CACHE];

const THREE_ORIGIN = 'https://unpkg.com';
const ASSET_PREFIXES = ['/images/', '/models/'];

self.addEventListener('install', (event) => {
    // Nothing is pre-fetched: assets are cached as they are first requested,
    // so a visitor who never opens the home page never downloads the model.
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
        } catch (e) { /* nothing to clean up */ }
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET') return;
    // Range requests must reach the server untouched.
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

function isCacheable(response) {
    if (!response) return false;
    if (response.status !== 200) return false;
    // Store same-origin ('basic') and CORS-readable responses only. Opaque
    // ones cannot be inspected, so a failure is indistinguishable from a
    // success and is not worth storing.
    return response.type === 'basic' || response.type === 'cors';
}

async function openCache(name) {
    try {
        return await caches.open(name);
    } catch (e) {
        // Storage can be unavailable (for example in private windows). Every
        // caller falls back to plain network requests.
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
        // Keep the worker alive for the refresh without making the page wait.
        event.waitUntil(revalidate);
        return cached;
    }

    return (await revalidate) || Response.error();
}
