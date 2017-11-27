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
