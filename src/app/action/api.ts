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


import { actionTick } from "@action/tick";
import * as toGeoJSON from "@mapbox/togeojson";
import { RouteGeo } from "@reducer/api";
import { FeatureCollection } from "geojson";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import apiData from "../api/data";
import { http } from "../network/http";
import { WorkerResponse } from "../network/httpInterfaces";
import { State } from "../reducer/interfaces";
import logg from "../util/logg";
import { DataAction, DataActionId } from "./interfaces";


const INTERVAL_UPDATE_VEHICLES = 15 * 1000; // Vehicles don't appear to update their location on the server in less than a minute.


const actionApi = Object.freeze({

    types: Object.freeze({
        updateKmlFiles: "updateKmlFiles",
        updateRoutes: "updateRoutes",
        updateStops: "updateStops",
        updateVehicles: "updateVehicles"
    }),

    /**
     * @param data Map of route ID to response vehicle information.
     */
    createUpdateVehiclesAction(data: Map<number, object[]>): DataAction<Map<number, object[]>> {
        return {
            data,
            type: actionApi.types.updateVehicles
        };
    },

    getRoutes(): ThunkAction<Promise<void>, State, null, any> {
        return async dispatch => {
            const res = await allRoutes();
            const { response, ok } = res;
            if (!ok) {
                // Error action.
                return;
            }

            dispatch(createUpdateRoutesAction(response));
            traces(dispatch, response);
            stops(dispatch, response);
        };
    },

    getVehicles(routeIds: number[], tickStartTime: number = null): ThunkAction<Promise<void>, State, null, any> {
        return async dispatch => {
            // const res = await http.get(`${apiData.domain}/InfoPoint/rest/Vehicles/GetAllVehiclesForRoutes?routeIDs=${routeIds.join(",")}`);
            logg.warn(() => "Getting vehicles from the dev server.");
            const res = await http.get(`http://localhost/InfoPoint/rest/Vehicles/GetAllVehiclesForRoutes?routeIDs=${routeIds.join(",")}`);

            if (res.response) {
                const data = new Map<number, object[]>();
                routeIds.forEach(id => {
                    data.set(id, (res.response as any[]).filter(vehicle => vehicle.RouteId === id));
                });

                dispatch(actionApi.createUpdateVehiclesAction(data));
            }

            dispatch(actionTick.add("getVehicles", { actionType: actionApi.types.updateVehicles, interval: INTERVAL_UPDATE_VEHICLES, startTime: tickStartTime }));
        };
    }

});


export { actionApi };


/**
 * @param data GeoJson information for a single route.
 */
function createUpdateKmlFilesAction(data: RouteGeo): DataAction<RouteGeo> {
    return {
        data,
        type: actionApi.types.updateKmlFiles
    };
}

/**
 * @param routes Response route infromation.
 */
function createUpdateRoutesAction(data: any): DataAction<any> {
    return {
        data,
        type: actionApi.types.updateRoutes
    };
}

/**
 * @param id The route ID.
 * @param data Response stop information.
 */
function createUpdateStopsAction(id: number, data: any): DataActionId<number, any> {
    return {
        data,
        id,
        type: actionApi.types.updateStops
    };
}

async function allRoutes(): Promise<WorkerResponse> {
    return http.get(`${apiData.domain}/InfoPoint/rest/Routes/GetVisibleRoutes`);
}

/**
 * @param dispatch 
 * @param routes Response route infromation.
 */
async function traces(dispatch: ThunkDispatch<State, null, DataAction<RouteGeo>>, routes: any[]): Promise<void> {
    routes.forEach(async route => {
        const res = await http.get(`${apiData.domain}/InfoPoint/Resources/Traces/${route.RouteTraceFilename}`, null, "text");

        // Convert from KML to geojson.
        const xml = new DOMParser().parseFromString(res.response, "text/xml");
        const geoJson: FeatureCollection = toGeoJSON.kml(xml);

        dispatch(createUpdateKmlFilesAction({ id: route.RouteId, geoJson }));
    });
}

/**
 * @param dispatch 
 * @param routes Response route infromation.
 */
async function stops(dispatch: ThunkDispatch<State, null, DataActionId<number, any>>, routes: any[]) {
    routes.forEach(async route => {
        const res = await http.get(`${apiData.domain}/InfoPoint/rest/Stops/GetAllStopsForRoutes?routeIDs=${route.RouteId}`);
        dispatch(createUpdateStopsAction(route.RouteId, res.response));
    });
}
