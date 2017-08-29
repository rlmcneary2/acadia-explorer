

// Already in the GlobalServiceWorkerScope, "this" means nothing here, just use
// the service worker functions directly (see addEventListener).


const _CACHE_VERSION = "v1";


addEventListener("activate", function (evt) {
    // Delete old caches here.
});

addEventListener("fetch", async function (evt) {
    const e = evt as any;
    e.respondWith(getFromCacheOrFetch(e));
});

addEventListener("install", function (evt) {
    (evt as any).waitUntil(
        caches.open(_CACHE_VERSION)
            .then(cache => {
                return cache.addAll([
                    // File path strings of resources here.
                    "/index.html",
                    "/app.js"
                ]);
            })
    );
});


async function getFromCacheOrFetch(evt: any): Promise<any> {
    let r = await caches.match(evt.request);
    if (!r) {
        r = await fetch(evt.request);

        // We may not want to cache everything. Like requests for the current
        // status of Island Explorer locations.

        await putInCache(evt, r);
    }

    return r;
}

async function putInCache(evt: any, response: any) {
    const cache = await caches.open(_CACHE_VERSION);
    cache.put(evt.request, response.clone());
}
