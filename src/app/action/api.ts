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


import { DataAction, DataActionId } from "./interfaces";
import { RouteGeo } from "@reducer/api";
import { http } from "../network/http";
import apiData from "../api/data";
import { WorkerResponse } from "../network/httpInterfaces";
import * as toGeoJSON from "@mapbox/togeojson";
import { FeatureCollection } from "geojson";


namespace actionApi {

    export const types = Object.freeze({
        addBusLocations: "addBusLocations",
        getRoutes: "getRoutes",
        updateBusLocations: "updateBusLocations",
        updateRoutes: "updateRoutes",
        updateStops: "updateStops",
        updateKmlFiles: "updateKmlFiles"
    });

    export function addBusLocations(routeId: number, requestId: string): DataActionId<number, string> {
        return {
            id: routeId,
            data: requestId,
            type: actionApi.types.addBusLocations
        };
    }

    export function getRoutes() {
        return async dispatch => {
            const res = await routes();
            const { ok } = res;
            if (!ok) {
                // Error action.
                return;
            }

            const response: any[] = res.response;
            dispatch(actionApi.updateRoutes(response));

            routeTraces(dispatch, response);
            routeStops(dispatch, response);
        };
    }

    export function updateBusLocations(locations: Map<number, object[]>): DataAction<Map<number, object[]>> {
        return {
            data: locations,
            type: actionApi.types.updateBusLocations
        };
    }

    export function updateKmlFiles(data: RouteGeo): DataAction<RouteGeo> {
        return {
            data,
            type: actionApi.types.updateKmlFiles
        };
    }

    export function updateRoutes(data: any): DataAction<any> {
        return {
            data,
            type: actionApi.types.updateRoutes
        };
    }

    export function updateStops(routeId: number, data): DataActionId<number, any> {
        return {
            id: routeId,
            data,
            type: actionApi.types.updateStops
        };
    }

}


export { actionApi };


async function routes(): Promise<WorkerResponse> {
    return await http.get(`${apiData.domain}/InfoPoint/rest/Routes/GetVisibleRoutes`);
}

async function routeTraces(dispatch, routes: any[]): Promise<void> {
    routes.forEach(async route => {
        const res = await http.get(`${apiData.domain}/InfoPoint/Resources/Traces/${route.RouteTraceFilename}`, null, "text");

        // Convert from KML to geojson.
        const xml = new DOMParser().parseFromString(res.response, "text/xml");
        const geoJson: FeatureCollection = toGeoJSON.kml(xml);

        dispatch(actionApi.updateKmlFiles({ id: route.RouteId, geoJson }));
    });
}

async function routeStops(dispatch, routes: any[]) {
    routes.forEach(async route => {
        const res = await http.get(`${apiData.domain}/InfoPoint/rest/Stops/GetAllStopsForRoutes?routeIDs=${route.RouteId}`);
        dispatch(actionApi.updateStops(route.RouteId, res.response));
    });
}
