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


import logg from "@util/logg";
import { WorkerRequest, WorkerResponse } from "./httpInterfaces";


const LOGG_CATEGORY = "hwrk";


logg.debug(() => "httpWorker - starting.", LOGG_CATEGORY);

const worker = (self as any) as Worker; // "as" gymanstics to prevent tslint errors.
worker.addEventListener("message", evt => {
    messageHandler(evt);
});


async function messageHandler(evt: MessageEvent) {
    const request: WorkerRequest = evt.data;

    let error;
    let res: Response;
    try {
        res = await fetchResponse(request);
    } catch (err) {
        error = err;
    }

    let ok: boolean;
    let status: number;
    let statusText: string;
    if (res) {
        ({ ok, status, statusText } = res);

        if (!ok || error) {
            if ((res as any).error) {
                res = (res as any).error();
            }
        }
    } else {
        ok = false;
        error = error || "Unknown error.";
    }

    if (error && error instanceof Error) {
        // An Error instance can't be copied in postMessage() so create a plain
        // object with the information available.
        const { message, name } = error;
        error = { message, name };
    }

    const workerResponse: any = {
        ok,
        status,
        statusText,
        uid: request.uid
    };

    if (ok && !error) {
        if (request.responseFunction) {
            workerResponse.response = await res[request.responseFunction]();
        } else {
            workerResponse.response = await res.json();
        }
    } else {
        if (!error) {
            workerResponse.error = await res.text();
        } else {
            workerResponse.error = error;
        }
    }

    worker.postMessage(workerResponse as WorkerResponse);
}

async function fetchResponse(request: WorkerRequest): Promise<Response> {
    const { method, url } = request;
    let options;
    if (method) {
        options = options || {};
        options.method = method;
    }

    if (request.headers && 0 < request.headers.length) {
        options = options || {};
        options.headers = new Headers();
        request.headers.forEach(item => {
            options.headers.append(item.name, item.value);
        });
    }

    const req = new Request(url, options);


    return fetch(req);
}
