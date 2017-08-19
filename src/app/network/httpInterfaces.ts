

interface RequestSignature {
    (url: string, headers?: Headers): Promise<WorkerResponse>;
}

interface WorkerRequest {
    headers?: Headers;
    method?: string; // Defaults to GET
    responseFunction?: string; // Defaults to json
    uid: number;
    url: string;
}

interface WorkerResponse {
    error?: any;
    ok: boolean;
    response?: any;
    status: number;
    statusText: string;
    uid: number;
}


export { RequestSignature, WorkerRequest, WorkerResponse };