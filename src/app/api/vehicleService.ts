/*
 * Copyright (c) 2018 Richard L. McNeary II
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


// TODO: move to a web worker.


import logg from "@util/logg";
import { Dispatch } from "redux";
import { actionApi } from "../action/api";
import apiData from "../api/data";
import { http } from "../network/http";


let active = false;
let dispatchFunc: Dispatch<void>;
let processTimeout: number = null;
const interval = 60 * 1000; // Vehicles don't appear to update their location on the server in less than a minute.
const LOG_CATEGORY = "vsrv";
const routesArr: any[] = [];


export default Object.freeze({

    addRoutes(routes: any[]) {
        routes.forEach(r => {
            if (routesArr.every(item => item.RouteId !== r.RouteId)) {
                routesArr.push(r);
            }
        });

        start();
    },

    hasDispatch(): boolean {
        return dispatchFunc ? true : false;
    },

    setDispatch(dispatch: Dispatch<void>) {
        if (dispatchFunc) {
            return;
        }

        dispatchFunc = dispatch;
    },

    stop() {
        routesArr.length = 0;

        if (processTimeout) {
            clearTimeout(processTimeout);
        }
    }

});


async function updateVehicles(nextTime = 0) {
    if (!routesArr.length) {
        active = false;
        processTimeout = null;
        logg.info(() => "vehicleService updateVehicles - no routes to process, stopping.", LOG_CATEGORY);
        return;
    }

    logg.debug(() => `vehicleService updateVehicles - start next attempt in ${Math.floor(nextTime / 1000)} seconds.`, LOG_CATEGORY);
    processTimeout = setTimeout(async () => {
        const processStart = Date.now();

        if (dispatchFunc) {
            // Get routes and dispatch.
            await vehicles();
        } else {
            logg.warn(() => "vehicleService updateVehicles - dispatch has not been set, can't get any vehicles.", LOG_CATEGORY);
        }

        const nt = interval - (Date.now() - processStart);
        updateVehicles(0 < nt ? nt : 0);
    }, nextTime) as any;
}

function start() {
    if (active) {
        return;
    }

    logg.debug(() => "vehicleService start - start processing routes.", LOG_CATEGORY);
    active = true;

    updateVehicles();
}

/**
 * @param dispatch 
 * @param routes Response route infromation.
 */
async function vehicles(): Promise<void> {
    const routeIds: number[] = routesArr.map(item => item.RouteId);

    const res = await http.get(`${apiData.domain}/InfoPoint/rest/Vehicles/GetAllVehiclesForRoutes?routeIDs=${routeIds.join(",")}`);
    const data = new Map<number, object[]>();
    routeIds.forEach(id => {
        data.set(id, (res.response as any[]).filter(vehicle => vehicle.RouteId === id));
    });

    logg.debug(() => "vehicleService vehicles - dispatching 'updateVehicles' action.", LOG_CATEGORY);
    dispatchFunc(actionApi.createUpdateVehiclesAction(data));
}

