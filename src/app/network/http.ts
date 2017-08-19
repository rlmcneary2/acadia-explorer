

import { Queue, Task, TaskCallback } from "asqueue";
import { RequestSignature, WorkerResponse } from "./httpInterfaces";
import client from "./httpWorkerClient";


const _queue = new Queue(4);


namespace http {

    export const get = async (url: string, headers?: Headers): Promise<WorkerResponse> => {
        return await handleTask(client.get, url, headers);
    };

}


export { http };


/**
 * Invoked by the Task to make the request to the remote.
 * @param {RequestSignature} httpMethod Must pass the function (not a string with the name) because after WebPack the function can't be found by name.
 * @param {string} url The URL of the resource.
 * @param {Headers} [headers] Request headers.
 * @returns {Promise<WorkerResponse>} The response from the remote.
 */
async function handleTask(httpMethod: RequestSignature, url: string, headers?: Headers) {
    const callback: TaskCallback<WorkerResponse> = (t): Promise<WorkerResponse> => {
        return new Promise(async resolve => {

            // Make the request to the server.
            const response = await httpMethod(url, headers);
            resolve(response);

        });
    };

    const task: Task<WorkerResponse> = {
        callback
    };

    return await _queue.add<WorkerResponse>(task);
}