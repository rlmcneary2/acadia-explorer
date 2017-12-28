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


namespace actionApi {

    export const types = Object.freeze({
        addBusLocations: "addBusLocations",
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
