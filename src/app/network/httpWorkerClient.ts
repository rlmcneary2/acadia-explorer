

import { WorkerHeader, WorkerRequest, WorkerResponse } from "./httpInterfaces";
const HttpWorker = require("worker-loader?name=serviceWorker.js!./httpWorker");


const worker = new HttpWorker() as Worker; // Singleton
const requests = new Map<number, (response: WorkerResponse) => void>();
let id = Date.now();


const http = {

    async get(url: string, headers?: Headers, responseType?: string): Promise<WorkerResponse> {
        return new Promise<WorkerResponse>(resolve => {
            id++;

            const h: WorkerHeader[] = [];
            if (headers) {
                headers.forEach((value, name) => {
                    h.push({ name, value });
                });
            }

            const request: WorkerRequest = {
                uid: id,
                url
            };

            if (h) {
                request.headers = h;
            }

            if (responseType) {
                request.responseFunction = responseType;
            }

            requests.set(request.uid, resolve);

            worker.postMessage(request);
        });
    }

};

export default http;


worker.addEventListener("message", evt => {
    const res: WorkerResponse = evt.data;

    if (requests.has(res.uid)) {
        const resolve = requests.get(res.uid);
        resolve(res);
    } else {
        console.error(`No resolve function for uid ${res.uid}`);
    }
});
