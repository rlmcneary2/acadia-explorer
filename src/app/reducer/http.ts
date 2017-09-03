

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
