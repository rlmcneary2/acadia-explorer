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


 // tslint:disable-next-line:no-submodule-imports
import HttpWorker from "worker-loader?name=httpWorker.js!./httpWorker";
import { WorkerHeader, WorkerRequest, WorkerResponse } from "./httpInterfaces";


const worker = new HttpWorker() as Worker; // Singleton
const requests = new Map<number, (response: WorkerResponse) => void>();
let id = Date.now();


const http = {

    async get(url: string, headers?: Headers, responseType?: string): Promise<WorkerResponse> {
        return new Promise<WorkerResponse>(resolve => {
            id++;

            const h: WorkerHeader[] = [];
            if (headers) {
                headers.forEach((value: any, name: any) => {
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
        // tslint:disable-next-line:no-console
        console.error(`No resolve function for uid ${res.uid}`);
    }
});
