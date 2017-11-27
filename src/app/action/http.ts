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


import {
    DataAction,
    HttpRequestDefinedUids,
    HttpRequestEndData,
    HttpRequestStartData
} from "./interfaces";
import { http } from "../network/http";


namespace actionHttp {

    export const types = Object.freeze({
        removeRequest: "removeRequest",
        requestEnd: "requestEnd",
        requestStart: "requestStart"
    });

    export function removeRequest(data: number | HttpRequestDefinedUids): DataAction<number | HttpRequestDefinedUids> {
        return {
            data,
            type: types.removeRequest
        };
    }

    export function request(data: HttpRequestStartData): (any) => void {
        return async dispatch => {
            dispatch(requestStart(data));

            const { headers, url, responseType } = data;
            const res = await http.get(url.toString(), headers, responseType);

            const { ok, response, status, statusText } = res;
            const endData: HttpRequestEndData = {
                ok,
                request: data,
                response,
                status,
                statusText
            };

            dispatch(requestEnd(endData));
        };
    }

    function requestEnd(data: HttpRequestEndData): DataAction<HttpRequestEndData> {
        return {
            data,
            type: types.requestEnd
        };
    }

    function requestStart(data: HttpRequestStartData): DataAction<HttpRequestStartData> {
        return {
            data,
            type: types.requestStart
        };
    }
}


export { actionHttp };
