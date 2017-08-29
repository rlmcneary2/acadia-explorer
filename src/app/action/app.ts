

import { HttpRequestData } from "./interfaces";
import { actionHttp } from "./http";


namespace actionApp {

    // const types = Object.freeze({
    //     start: "start"
    // });

    export function initialize(): (any) => void {
        return dispatch => {
            const uid = Date.now();
            const request: HttpRequestData = {
                uid,
                url: new URL(`https://islandexplorertracker.availtec.com/InfoPoint/rest/Routes/GetVisibleRoutes?_${uid}`)
            };

            dispatch(actionHttp.request(request));
        };
    }

    // export function start(): BaseAction {
    //     return {
    //         type: types.start
    //     };
    // }

}


export { actionApp };
