

interface BaseAction {
    type: string;
}

interface DataAction<T> extends BaseAction {
    data: T;
}

interface DataActionId<U, T> extends DataAction<T> {
    id: U;
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
    headers?: Headers;
    responseType?: string;
    uid: number | HttpRequestDefinedUids;
    url: URL;
}

enum HttpRequestDefinedUids {
    GetRoutes = 1000000
}

export {
    BaseAction,
    DataAction,
    DataActionId,
    HttpRequestDefinedUids,
    HttpRequestEndData,
    HttpRequestStartData
};
