

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

    const { ok, status, statusText } = res;

    if (!ok || error) {
        if ((res as any).error) {
            res = (res as any).error();
        }
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
    const req = new Request(request.url, request);
    return await fetch(req);
}
