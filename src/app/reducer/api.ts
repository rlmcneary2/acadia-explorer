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


import { FeatureCollection } from "geojson";
import { Action } from "redux";
import { actionApi } from "../action/api";
import { DataAction, DataActionId } from "../action/interfaces";


export default (state: State = { routeGeos: [], routes: [], routeStops: [], routeVehicles: [] }, action: Action): State => {
    let nextState: State;

    switch (action.type) {

        case actionApi.types.updateVehicles: {
            const a = action as DataAction<Map<number, object[]>>;

            const routeVehicles: RouteVehicles[] = [];
            a.data.forEach((vehicles, id) => {
                routeVehicles.push({ id, vehicles });
            });

            nextState = { ...state, routeVehicles };
            break;
        }

        case actionApi.types.updateKmlFiles: {
            const a = action as DataAction<RouteGeo>;

            // Only add the geojson information if this route doesn't already
            // exist.
            const index = state.routeGeos.findIndex(item => item.id === a.data.id);
            if (index < 0) {
                const rg = state.routeGeos ? [...state.routeGeos] : [];
                rg.push(a.data);
                nextState = { ...state, routeGeos: rg };
            }

            break;
        }

        case actionApi.types.updateRoutes: {
            const a = action as DataAction<any>;
            nextState = { ...state, routes: a.data };
            break;
        }

        case actionApi.types.updateStops: {
            const a = action as DataActionId<number, any>;

            // Only add the stop information if this route doesn't already
            // exist.
            const index = state.routeStops.findIndex(item => item.id === a.id);
            if (index < 0) {
                const rs = state.routeStops ? [...state.routeStops] : [];
                rs.push({ id: a.id, stops: a.data });
                nextState = { ...state, routeStops: rs };
            }

            break;
        }

    }

    return nextState || state;
};


interface RouteGeo {
    id: number;
    geoJson: FeatureCollection;
}

/** Object returned by GetAllStopsForRoutes. */
interface RouteStops {
    /** The route ID. */
    id: number;
    stops: RouteStopsStop[];
}

export interface RouteStopsStop {
    Description: string;
    Latitude: number;
    Longitude: number;
    Name: string;
    StopId: number;
}

interface RouteVehicles {
    /**
     * The ID of the route the vehicle is on.
     */
    id: number;
    vehicles: any[];
}

interface State {
    routeGeos: RouteGeo[];
    routes: any[];
    routeStops: RouteStops[];
    routeVehicles: RouteVehicles[];
}


export { RouteGeo, RouteStops, RouteVehicles, State };
