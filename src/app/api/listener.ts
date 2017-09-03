

import { actionApi } from "../action/api";
import { actionHttp } from "../action/http";
import { HttpRequestDefinedUids } from "../action/interfaces";
import { State } from "../reducer/interfaces";
import * as redux from "redux";


export default (store: redux.Store<{}>) => {
    const state = store.getState() as State;
    httpHandler(store.dispatch, state);
};


function httpHandler(dispatch: redux.Dispatch<{}>, state: State) {
    if (state.http.requests.length < 1) {
        return;
    }

    const routeRequest = state.http.requests.find(item => item.response && item.uid === HttpRequestDefinedUids.GetRoutes);
    if (routeRequest) {
        // Have to let this stack unwind otherwise recurse forever!
        setTimeout(() => {
            dispatch(actionHttp.removeRequest(routeRequest.uid));
            dispatch(actionApi.updateRoutes(routeRequest.response.response)); // Doesn't handle errors! Pass HttpRequestEndData instead.
        });
    }
}
