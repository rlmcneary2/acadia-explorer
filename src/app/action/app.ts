

import { HttpRequestDefinedUids, HttpRequestStartData } from "./interfaces";
import { actionHttp } from "./http";
import apiData from "../api/data";


namespace actionApp {

    export function initialize(): (any) => void {
        return dispatch => {
            const request: HttpRequestStartData = {
                uid: HttpRequestDefinedUids.GetRoutes,
                url: new URL(`${apiData.domain}/InfoPoint/rest/Routes/GetVisibleRoutes`)
            };

            dispatch(actionHttp.request(request));
        };
    }

}


export { actionApp };
