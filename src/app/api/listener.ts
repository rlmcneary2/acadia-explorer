

import { actionApi } from "../action/api";
import { actionHttp } from "../action/http";
import { HttpRequestDefinedUids } from "../action/interfaces";
import { State } from "../reducer/interfaces";
import * as redux from "redux";


export default (store: redux.Store<{}>) => {
    const state = store.getState() as State;
    httpHandler(store.dispatch, state);
};


let _kmlRequests: number[] = [];
function httpHandler(dispatch: redux.Dispatch<{}>, state: State) {
    if (state.http.requests.length < 1) {
        return;
    }

    const routeRequest = state.http.requests.find(item => item.response && item.uid === HttpRequestDefinedUids.GetRoutes);
    if (routeRequest) {
        const { response } = routeRequest.response;

        // Have to let this stack unwind otherwise recurse forever!
        setTimeout(() => {
            dispatch(actionHttp.removeRequest(routeRequest.uid));
            dispatch(actionApi.updateRoutes(response)); // Doesn't handle errors! Pass HttpRequestEndData instead.

            // Get KML files.
            _kmlRequests = [];
            response.forEach(item => {
                const uid = Date.now();
                _kmlRequests.push(uid);
                dispatch(actionHttp.request({
                    responseType: "text",
                    uid,
                    url: new URL(`https://islandexplorertracker.availtec.com/InfoPoint/Resources/Traces/${item.RouteTraceFilename}`)
                }));
            });
        });
    }

    const kmlRequests = state.http.requests.filter(item => item.response && _kmlRequests.includes(item.uid));
    if (kmlRequests && 0 < kmlRequests.length) {
        kmlRequests.forEach(item => {
            dispatch(actionHttp.removeRequest(item.uid));
            const i = _kmlRequests.findIndex(uid => uid === item.uid);
            if (-1 < i) {
                _kmlRequests.splice(i, 1);
            }
        });

        setTimeout(() => {
            kmlRequests.forEach(item => {
                const parts = item.response.request.url.pathname.split("/");
                dispatch(actionApi.updateKmlFiles({ id: parts[parts.length - 1], xml: item.response.response }));
            });
        });
    }
}
