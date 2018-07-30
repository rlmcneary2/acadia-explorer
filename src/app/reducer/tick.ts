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
import { BaseAction, DataActionId, TickStartActionData } from "../action/interfaces";
import { actionTick } from "../action/tick";


export default (state: State = { ticks: [] }, action: BaseAction): State => {
    let nextState: State;

    switch (action.type) {

        case actionTick.types.add: {
            const { data: interval, id } = (action as DataActionId<string, number>);
            const index = state.ticks.findIndex(item => item.id === id);
            if (index < 0) {
                ({ ...nextState } = state);
                nextState.ticks = [...state.ticks];
                nextState.ticks.push({ id, interval });
            } else {
                logg.warn(() => `tick reducer - [${action.type}] entry already exists for tick id '${id}'.`);
            }
            break;
        }

        case actionTick.types.end: {
            const { data: endTime, id } = (action as DataActionId<string, number>);
            const index = state.ticks.findIndex(item => item.id === id);
            if (-1 < index) {
                ({ ...nextState } = state);
                nextState.ticks = [...state.ticks];
                nextState.ticks[index] = { ...nextState.ticks[index], ...{ endTime } };
            } else {
                logg.warn(() => `tick reducer - [${action.type}] no entry found for tick id '${id}'.`);
            }
            break;
        }

        case actionTick.types.start: {
            const { data, id } = (action as DataActionId<string, TickStartActionData>);
            const { startTime, timeoutId } = data;
            const index = state.ticks.findIndex(item => item.id === id);
            if (-1 < index) {
                ({ ...nextState } = state);
                nextState.ticks = [...state.ticks];
                nextState.ticks[index] = { ...nextState.ticks[index], ...{ id, startTime, timeoutId } };
            } else {
                logg.warn(() => `tick reducer - [${action.type}] no entry found for tick id '${id}'.`);
            }
            break;
        }

    }

    return nextState || state;
};


interface State {
    ticks: TicksItem[];
}

interface TicksItem {
    endTime?: number;
    id: string;
    interval: number;
    startTime?: number;
    timeoutId?: number;
}


export { State, TicksItem };
