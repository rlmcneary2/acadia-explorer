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


import { State } from "@reducer/interfaces";
import { ThunkAction } from "redux-thunk";
import { http } from "../network/http";
import { WorkerResponse } from "../network/httpInterfaces";
import { Landmark, Route } from "../reducer/app";
import { actionApi } from "./api";
import { DataAction /*, DataActionId*/ } from "./interfaces";


const LOCATION = "acadia";


const actionApp = Object.freeze({

    types: Object.freeze({
        // updateLastStop: "appUpdateLastStop",
        updateAppData: "appUpdateAppData"
        // updateStops: "appUpdateStops"
    }),

    initialize(): ThunkAction<Promise<void>, State, null, any> {
        return async dispatch => {
            dispatch(actionApi.getRoutes());

            const response = await getAppData();
            const { response: data = {} }  = response;
            dispatch(actionApp.updateAppData(data));
        };
    },

    /**
     * Add last stop information by route ID.
     * @param id The route ID.
     * @param data The data to add to the route's lastStopData array.
     */
    // updateLastStop(id: string, data: StateStopData): DataActionId<string, StateStopData> {
    //     return {
    //         data,
    //         id,
    //         type: actionApp.types.updateStops
    //     };
    // },

    updateAppData(data: { landmarks: Landmark[]; routes: Route[] }): DataAction<{ landmarks: Landmark[]; routes: Route[] }> {
        return {
            data,
            type: actionApp.types.updateAppData
        };
    }

    // updateStops(id: string, data: StateStop[]): DataActionId<string, StateStop[]> {
    //     return {
    //         data,
    //         id,
    //         type: actionApp.types.updateStops
    //     };
    // }

});


export { actionApp };


async function getAppData(): Promise<WorkerResponse> {
    return http.get(`/${LOCATION}/app.json`, null, "json");
}
