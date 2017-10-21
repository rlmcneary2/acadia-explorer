

interface BaseAction {
    type: string;
}

/**
 * An action response that has data.
 * @interface DataAction
 * @extends {BaseAction}
 * @template T The type of the data.
 */
interface DataAction<T> extends BaseAction {
    data: T;
}

/**
 * An action response that has data associated with an ID.
 * @interface DataActionId
 * @extends {DataAction<T>}
 * @template S The type of the id.
 * @template T The type of the data.
 */
interface DataActionId<S, T> extends DataAction<T> {
    id: S;
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
