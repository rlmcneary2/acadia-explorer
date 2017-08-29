

interface BaseAction {
    type: string;
}

interface HttpRequestEndAction extends BaseAction {
    data: HttpRequestEndData;
}

interface HttpRequestStartAction extends BaseAction {
    data: HttpRequestStartData;
}

interface HttpRequestEndData {
    headers?: Headers;
    ok: boolean;
    response?: any;
    request: HttpRequestStartData;
    status?: number;
    statusText?: string;
}

interface HttpRequestStartData {
    uid: number;
    url: URL;
}


export { BaseAction, HttpRequestEndAction, HttpRequestEndData, HttpRequestStartAction, HttpRequestStartData };
