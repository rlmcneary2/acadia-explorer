

import { HttpRequestEndAction, HttpRequestEndData, HttpRequestStartAction, HttpRequestStartData } from "./interfaces";
import { http } from "../network/http";


namespace actionHttp {

    export const types = Object.freeze({
        requestEnd: "requestEnd",
        requestStart: "requestStart"
    });

    export function request(data: HttpRequestStartData): (any) => void {
        return async dispatch => {
            dispatch(requestStart(data));

            const res = await http.get(data.url.toString());

            const { ok, response, status, statusText } = res;
            const endData: HttpRequestEndData = {
                ok,
                response,
                request: data,
                status,
                statusText
            };

            dispatch(requestEnd(endData));
        };
    }

    function requestEnd(data: HttpRequestEndData): HttpRequestEndAction {
        return {
            data,
            type: types.requestEnd
        };
    }

    function requestStart(data: HttpRequestStartData): HttpRequestStartAction {
        return {
            data,
            type: types.requestStart
        };
    }
}


export { actionHttp };
