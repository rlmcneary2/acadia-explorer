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


import { Queue, Task, TaskCallback } from "asqueue";
import { RequestSignature, WorkerResponse } from "./httpInterfaces";
import client from "./httpWorkerClient";


const _queue = new Queue(4);


namespace http {

    export const get = async (url: string, headers: Headers = null, responseType: string = null): Promise<WorkerResponse> => {
        return await handleTask(client.get, url, headers, responseType);
    };

}


export { http };


/**
 * Invoked by the Task to make the request to the remote.
 * @param {RequestSignature} httpMethod Must pass the function (not a string with the name) because after WebPack the function can't be found by name.
 * @param {string} url The URL of the resource.
 * @param {Headers} [headers] Request headers.
 * @param {string} [responseType] The fetch function to use when reading the response.
 * @returns {Promise<WorkerResponse>} The response from the remote.
 */
async function handleTask(httpMethod: RequestSignature, url: string, headers?: Headers, responseType?: string) {
    const callback: TaskCallback<WorkerResponse> = (t): Promise<WorkerResponse> => {
        return new Promise(async resolve => {

            // Make the request to the server.
            const response = await httpMethod(url, headers, responseType);
            resolve(response);

        });
    };

    const task: Task<WorkerResponse> = {
        callback
    };

    return await _queue.add<WorkerResponse>(task);
}