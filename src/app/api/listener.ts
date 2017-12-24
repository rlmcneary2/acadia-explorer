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


import { actionApi } from "../action/api";
import { actionHttp } from "../action/http";
import { HttpRequestDefinedUids } from "../action/interfaces";
import { State } from "../reducer/interfaces";
import * as redux from "redux";
import * as toGeoJSON from "@mapbox/togeojson";
import apiData from "./data";


export default (store: redux.Store<{}>) => {
    const state = store.getState() as State;
    httpHandler(store.dispatch, state);
    busLocationsHandler(store.dispatch, state);
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
                    url: new URL(`${apiData.domain}/InfoPoint/Resources/Traces/${item.RouteTraceFilename}`)
                } as any)));

                uid++;
                _stopRequests.push(uid);
                dispatch(actionHttp.request(({
                    routeId: item.RouteId,
                    uid: uid,
                    url: new URL(`${apiData.domain}/InfoPoint/rest/Stops/GetAllStopsForRoutes?routeIDs=${item.RouteId}`)
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


let _busLocationRequests: number[] = [];
let _busLocationTimeout: number = null;
function busLocationsHandler(dispatch: redux.Dispatch<{}>, state: State) {
    // Create a new array every time state changes.
    _busLocationRequests = state.api.busLocations.reduce((acc: number[], item) => {
        if (!acc.some(x => x === item.routeId)) {
            acc.push(item.routeId);
        }

        return acc;
    }, []);

    if (0 < _busLocationRequests.length) {
        if (_busLocationTimeout === null) {
            _busLocationTimeout = setTimeout(busLocationTimeout);
        }
    }
}

function busLocationTimeout() {
    if (_busLocationRequests.length < 1) {
        _busLocationTimeout = null;
        return;
    }

    const start = Date.now();

    // TODO: Get the bus locations!
    console.log("TODO: get bus locations.");

    const stop = Date.now();

    const timeout = (30 * 1000) - (stop - start);
    _busLocationTimeout = window.setTimeout(busLocationTimeout, timeout < 0 ? 0 : timeout);
}
