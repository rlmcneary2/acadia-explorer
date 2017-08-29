

interface BaseAction {
    type: string;
}

interface HttpResponseAction extends BaseAction {
    data: HttpResponseData;
}

interface HttpRequestAction extends BaseAction {
    data: HttpRequestData;
}

interface HttpResponseData {
    headers?: Headers;
    ok: boolean;
    response?: any;
    request: HttpRequestData;
    status?: number;
    statusText?: string;
}

interface HttpRequestData {
    uid: number;
    url: URL;
}


export { BaseAction, HttpResponseAction, HttpResponseData, HttpRequestAction, HttpRequestData };
