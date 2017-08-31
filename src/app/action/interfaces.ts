

interface BaseAction {
    type: string;
}

interface DataAction<T> extends BaseAction {
    data: T;
}

interface HttpRequestEndData {
    headers?: Headers;
    ok: boolean;
    request: HttpRequestStartData;
    response?: any;
    status?: number;
    statusText?: string;
}

interface HttpRequestStartData {
    uid: number | HttpRequestDefinedUids;
    url: URL;
}

enum HttpRequestDefinedUids {
    GetRoutes = 1000000
}

export {
    BaseAction,
    DataAction,
    HttpRequestDefinedUids,
    HttpRequestEndData,
    HttpRequestStartData
};
