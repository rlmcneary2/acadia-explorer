

import { WorkerRequest, WorkerResponse } from "./httpInterfaces";
const HttpWorker = require("worker-loader!./httpWorker");


const worker = new HttpWorker() as Worker; // Singleton
const requests = new Map<number, (response: WorkerResponse) => void>();
let id = Date.now();


const http = {

    async get(url: string, headers?: Headers): Promise<WorkerResponse> {
        return new Promise<WorkerResponse>(resolve => {
            id++;
            const request: WorkerRequest = {
                headers,
                uid: id,
                url
            };

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
