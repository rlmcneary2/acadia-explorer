

import { WorkerRequest, WorkerResponse } from "./httpInterfaces";


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


    return await fetch(req);
}
