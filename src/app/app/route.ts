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


import { Stop, StopSchedule } from "./interfaces";
import { StopNode } from "./stopNode";


/**
 * This is a structure of temporary data that is not part of redux state but is
 * used to build data that will eventually become part of state.
 */
const appData: AppData = {
    routeStopChains: null,
    routeStops: null,
    stops: []
};


export { appData };


interface AppData {
    /** The key is the route ID. */
    routeStopChains: { [key: number]: StopChain[]; };
    /** The key is the route ID. */
    routeStops: { [key: number]: RouteStops[]; };
    stops: StopEntry[];
}

export interface RouteStops extends StopSchedule {
    stops: Stop[];
}

/**
 * Information about a stop that will be used to build up a dynamic list of
 * stops.
 */
export interface StopEntry extends Stop {
    /** The time when this entry was created (for sorting stops in route order). */
    created: number;
    vehicleId: number;
    routeId: number;
    runId: number;
    tripId: number;
}

export interface StopChain extends StopSchedule {
    nodes: StopNode[];
}
