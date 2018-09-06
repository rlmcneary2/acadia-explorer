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

import { actionApi } from "@action/api";
import { actionTick } from "@action/tick";
import logg from "@util/logg";
import { Store } from "redux";
import { State } from "../reducer/interfaces";


const LOG_CATEGORY = "tckl";


export default (store: Store<State>) => {
    const startTime = Date.now();
    const state: State = store.getState();

    const addedTicks = [...state.tick.ticks.filter(item => item.state === "added")];
    addedTicksHandler(store, startTime, addedTicks);

    const endedTicks = [...state.tick.ticks.filter(item => item.state === "ended")];
    endedTicksHandler(store, startTime, endedTicks);
};


function addedTicksHandler(store: Store<State>, startTime: number, addedTicks: State["tick"]["ticks"]) {
    addedTicks.forEach(item => {
        logg.debug(() => `tickListener addedTicksHandler - starting '${item.id}[${item.actionType}]'.`, LOG_CATEGORY);
        const timeoutId = startTick(store, startTime, item);
        store.dispatch(actionTick.start(item.id, item.startTime || startTime, timeoutId));
    });
}

function endedTicksHandler(store: Store<State>, startTime: number, endedTicks: State["tick"]["ticks"]) {
    endedTicks.forEach(item => {
        switch (item.actionType) {
            case actionApi.types.updateVehicles: {
                logg.debug(() => `tickListener endedTicksHandler - updateVehicles '${item.id}[${item.actionType}]'.`, LOG_CATEGORY);

                store.dispatch(actionTick.remove(item.id));

                let routes = store.getState().api.routes;
                routes = routes.map(r => r.RouteId);
                store.dispatch(actionApi.getVehicles(routes, startTime));
                break;
            }

            default: {
                logg.warn(() => `tickListener endedTicksHandler - no case for actionType '${item.actionType}'.`, LOG_CATEGORY);
                break;
            }
        }
    });
}

function startTick(store: Store<State>, startTime: number, tick: State["tick"]["ticks"][number]): number {
    const delay = tick.interval - (Date.now() - startTime);
    logg.debug(() => `tickListener startTick - setting tick for id '${tick.id}' in ${Math.floor(delay / 1000)} seconds.`, LOG_CATEGORY);
    return setTimeout(() => {
        const endTime = Date.now();
        logg.debug(() => `tickListener startTick - timeout for id '${tick.id}'.)`, LOG_CATEGORY);
        store.dispatch(actionTick.end(tick.id, endTime));
    }, tick.interval - (Date.now() - startTime)) as any;
}
