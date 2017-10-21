

import { HttpRequestDefinedUids, HttpRequestStartData } from "./interfaces";
import { actionHttp } from "./http";


namespace actionApp {

    export function initialize(): (any) => void {
        return dispatch => {
            const request: HttpRequestStartData = {
                uid: HttpRequestDefinedUids.GetRoutes,
                url: new URL("https://islandexplorertracker.availtec.com/InfoPoint/rest/Routes/GetVisibleRoutes")
            };

            dispatch(actionHttp.request(request));
        };
    }

}


export { actionApp };
