

import { actionApi } from "../action/api";
import { actionHttp } from "../action/http";
import { HttpRequestDefinedUids } from "../action/interfaces";
import { State } from "../reducer/interfaces";
import * as redux from "redux";
import * as toGeoJSON from "@mapbox/togeojson";


export default (store: redux.Store<{}>) => {
    const state = store.getState() as State;
    httpHandler(store.dispatch, state);
};


let _kmlRequests: number[] = [];
let _stopRequests: number[] = [];
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

            // Get KML files and stop information for each route.
            _kmlRequests = [];
            _stopRequests = [];
            let uid = Date.now();
            response.forEach(item => {
                _kmlRequests.push(uid);
                dispatch(actionHttp.request(({
                    responseType: "text",
                    routeId: item.RouteId,
                    uid: uid,
                    url: new URL(`https://islandexplorertracker.availtec.com/InfoPoint/Resources/Traces/${item.RouteTraceFilename}`)
                } as any)));

                uid++;
                _stopRequests.push(uid);
                dispatch(actionHttp.request(({
                    routeId: item.RouteId,
                    uid: uid,
                    url: new URL(`https://islandexplorertracker.availtec.com/InfoPoint/rest/Stops/GetAllStopsForRoutes?routeIDs=${item.RouteId}`)
                } as any)));

                uid++;
            });
        });
    }

    // Handle the response to get the KML file associated with each route.
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
                // Convert from KML to geojson.
                const xml = new DOMParser().parseFromString(item.response.response, "text/xml");
                const geoJson = toGeoJSON.kml(xml);

                dispatch(actionApi.updateKmlFiles({ id: (item as any).routeId, geoJson }));
            });
        });
    }

    // Handle the response to get the stops associated with each route.
    const stopRequests = state.http.requests.filter(item => item.response && _stopRequests.includes(item.uid));
    if (stopRequests && 0 < stopRequests.length) {
        stopRequests.forEach(item => {
            dispatch(actionHttp.removeRequest(item.uid));
            const i = _stopRequests.findIndex(uid => uid === item.uid);
            if (-1 < i) {
                _stopRequests.splice(i, 1);
            }
        });

        setTimeout(() => {
            stopRequests.forEach(item => {
                if (item.response.ok) {
                    const routeId = item.response.request.url.searchParams.get("routeIDs");
                    dispatch(actionApi.updateStops(parseInt(routeId), item.response.response));
                }
            });
        });
    }

}
