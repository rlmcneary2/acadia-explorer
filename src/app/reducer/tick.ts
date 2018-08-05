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


import logg from "@util/logg";
import { BaseAction, BaseActionId, DataActionId, TickStartActionData } from "../action/interfaces";
import { actionTick } from "../action/tick";


const LOG_CATEGORY = "tickr";


export default (state: State = { ticks: [] }, action: BaseAction): State => {
    let nextState: State;

    switch (action.type) {

        case actionTick.types.add: {
            const { data, id } = (action as DataActionId<string, { actionType: string; interval: number; startTime?: number; }>);
            const { actionType, interval, startTime } = data;
            const index = state.ticks.findIndex(item => item.id === id);
            const previousTickItem: TicksItem = -1 < index ? state.ticks[index] : ({} as any);

            // Don't "add" a tick that is currently operating.
            if (previousTickItem.state && previousTickItem.state !== "ended") {
                break;
            }

            const ticks = [...state.ticks];
            if (-1 < index) {
                ticks.splice(index, 1);
            }

            const nextTick: TicksItem = { ...copyPreviousTicksItem(previousTickItem), actionType, id, state: "added" };
            if (interval) {
                nextTick.interval = interval;
            }

            if (startTime) {
                nextTick.startTime = startTime;
            }

            ticks.push(nextTick);
            nextState = { ...state, ticks };
            break;
        }

        case actionTick.types.end: {
            const { data: endTime, id } = (action as DataActionId<string, number>);
            const index = state.ticks.findIndex(item => item.id === id);
            if (-1 < index) {
                const ticks: TicksItem[] = [...state.ticks];
                ticks[index] = { ...state.ticks[index], ...{ endTime, state: "ended" } };
                nextState = { ...state, ticks };
            } else {
                logg.warn(() => `tick reducer - [${action.type}] no entry found for tick id '${id}'.`, LOG_CATEGORY);
            }
            break;
        }

        case actionTick.types.remove: {
            const { id } = (action as BaseActionId<string>);
            const index = state.ticks.findIndex(item => item.id === id);
            if (-1 < index) {
                const ticks = [...state.ticks];
                ticks.splice(index, 1);
                nextState = { ...state, ticks };
            }

            break;
        }

        case actionTick.types.start: {
            const { data, id } = (action as DataActionId<string, TickStartActionData>);
            const { startTime, timeoutId } = data;
            const index = state.ticks.findIndex(item => item.id === id);
            if (-1 < index) {
                const ticks = [...state.ticks];
                ticks[index] = { ...state.ticks[index], ...{ id, startTime, state: "started", timeoutId } };
                nextState = { ...state, ticks };
            } else {
                logg.warn(() => `tick reducer - [${action.type}] no entry found for tick id '${id}'.`, LOG_CATEGORY);
            }
            break;
        }

    }

    return nextState || state;
};


function copyPreviousTicksItem(tickItem: TicksItem): TicksItem {
    const { endTime, startTime, state, ...result } = tickItem;
    return result as any;
}


interface State {
    ticks: TicksItem[];
}

interface TicksItem {
    actionType: string;
    endTime?: number;
    id: string;
    interval: number;
    startTime?: number;
    state: "added" | "started" | "ended";
    timeoutId?: number;
}


export { State, TicksItem };
