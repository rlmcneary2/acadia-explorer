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


import { actionHttp } from "../action/http";
import {
    BaseAction,
    DataAction,
    HttpRequestDefinedUids,
    HttpRequestStartData,
    HttpRequestEndData
} from "../action/interfaces";


export default (state: State = { requests: [] }, action: BaseAction): State => {
    let nextState: State;

    switch (action.type) {
        case actionHttp.types.removeRequest: {
            const a = action as DataAction<number | HttpRequestDefinedUids>;
            const index = state.requests.findIndex(item => item.uid === a.data);

            if (0 <= index) {
                const r = state.requests.slice();
                r.splice(index, 1);

                nextState = Object.assign({}, state);
                nextState.requests = r;
            }

            break;
        }

        case actionHttp.types.requestEnd: {
            const a = action as DataAction<HttpRequestEndData>;
            const index = state.requests.findIndex(item => item.uid === a.data.request.uid);

            if (0 <= index) {
                const d = Object.assign({}, state.requests[index]);
                d.response = a.data;

                const r = state.requests.slice(0);
                r[index] = d;

                nextState = Object.assign({}, state);
                nextState.requests = r;
            }

            break;
        }

        case actionHttp.types.requestStart: {
            const a = action as DataAction<HttpRequestStartData>;
            const index = state.requests.findIndex(item => item.uid === a.data.uid);

            if (index < 0) {
                const r = state.requests.slice(0);
                r.push(Object.assign({}, a.data));
                nextState = Object.assign({}, state);
                nextState.requests = r;
            }

            break;
        }
    }

    return nextState || state;
};


interface State {
    requests: {
        response?: HttpRequestEndData;
        uid: number;
        url: URL;
    }[];
}


export { State };
