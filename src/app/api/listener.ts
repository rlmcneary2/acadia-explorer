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


let _vehicleLocationsRequest: {
    activeRoutes: number[];
    start: number;
    stop: number;
    timeoutId: number;
} = null;

function busLocationsHandler(dispatch: redux.Dispatch<{}>, state: State) {
    const nextVehicleLocationsRequest: any = {};
    nextVehicleLocationsRequest.activeRoutes = state.api.busLocations.reduce((acc: number[], item) => {
        if (!acc.some(x => x === item.routeId)) {
            acc.push(item.routeId);
        }

        return acc;
    }, []);

    // TODO: Have any new routes been added? If so the current timeout (if any)
    // must be canceled and a request that includes the locations of vehicles on
    // all the current routes should be made right away.

    let timeout = 0;

    // Has a response been returned from a request for vehicle locations?
    const request = state.http.requests.find(item => item.response && item.uid === HttpRequestDefinedUids.GetAllVehiclesForRoutes);
    if (request) {
        console.log("listener busLocationHandler - request: %O", request);
        _vehicleLocationsRequest.stop = Date.now();
        dispatch(actionHttp.removeRequest(HttpRequestDefinedUids.GetAllVehiclesForRoutes));

        if (request.response.ok) {
            const data = new Map<number, object[]>();
            _vehicleLocationsRequest.activeRoutes.forEach(id => {
                data.set(id, (request.response.response as any[]).filter(vehicle => vehicle.RouteId === id));
            });

            dispatch(actionApi.updateBusLocations(data));

            timeout = (30 * 1000) - (_vehicleLocationsRequest.stop - _vehicleLocationsRequest.start);

            _vehicleLocationsRequest = null;
        }
    }

    if (0 < nextVehicleLocationsRequest.activeRoutes.length) {
        if (_vehicleLocationsRequest === null) {
            console.log(`listener busLocationHandler - timeout: ${Math.round(timeout < 0 ? 0 : timeout / 1000)}`);
            nextVehicleLocationsRequest.timeoutId = window.setTimeout(() => busLocationTimeout(dispatch), timeout < 0 ? 0 : timeout);
            _vehicleLocationsRequest = nextVehicleLocationsRequest;
        }
    }
}

function busLocationTimeout(dispatch: redux.Dispatch<{}>) {
    if (_vehicleLocationsRequest.activeRoutes.length < 1) {
        _vehicleLocationsRequest = null;
        return;
    }

    _vehicleLocationsRequest.start = Date.now();

    console.log("listener busLocationHandler - getting bus locations.");

    dispatch(actionHttp.request(({
        uid: HttpRequestDefinedUids.GetAllVehiclesForRoutes,
        url: new URL(`${apiData.domain}/InfoPoint/rest/Vehicles/GetAllVehiclesForRoutes?routeIDs=${_vehicleLocationsRequest.activeRoutes.join(",")}`)
    } as any)));
}
