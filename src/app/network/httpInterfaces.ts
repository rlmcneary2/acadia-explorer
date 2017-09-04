

interface RequestSignature {
    (url: string, headers?: Headers, responseType?: string): Promise<WorkerResponse>;
}

interface WorkerHeader {
    name: string;
    value: string;
}

interface WorkerRequest {
    headers?: WorkerHeader[];
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


export { RequestSignature, WorkerHeader, WorkerRequest, WorkerResponse };