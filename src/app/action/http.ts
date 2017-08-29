

import { HttpResponseAction, HttpResponseData, HttpRequestAction, HttpRequestData } from "./interfaces";
import { http } from "../network/http";


namespace actionHttp {

    export const types = Object.freeze({
        requestEnd: "requestEnd",
        requestStart: "requestStart"
    });

    export function request(data: HttpRequestData): (any) => void {
        return async dispatch => {
            dispatch(requestStart(data));

            const res = await http.get(data.url.toString());

            const { ok, response, status, statusText } = res;
            const responseData: HttpResponseData = {
                ok,
                response,
                request: data,
                status,
                statusText
            };

            dispatch(requestEnd(responseData));
        };
    }

    function requestEnd(data: HttpResponseData): HttpResponseAction {
        return {
            data,
            type: types.requestEnd
        };
    }

    function requestStart(data: HttpRequestData): HttpRequestAction {
        return {
            data,
            type: types.requestStart
        };
    }
}


export { actionHttp };
