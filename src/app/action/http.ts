

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

            const res = await http.get(data.url.toString());

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
