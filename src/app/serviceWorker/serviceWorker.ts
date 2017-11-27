/*
 * Copyright (c) 2017 Richard L. McNeary II
 *
 * MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


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
