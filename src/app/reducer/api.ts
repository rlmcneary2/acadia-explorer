

import { actionApi } from "../action/api";
import { BaseAction, DataAction, } from "../action/interfaces";


export default (state: State = {}, action: BaseAction): State => {
    let nextState: State;

    switch (action.type) {

        case actionApi.types.updateKmlFiles: {
            const a = action as DataAction<any>;
            nextState = Object.assign({}, state);
            const kf = state.kmlFiles ? [...state.kmlFiles] : [];
            kf.push(a.data);
            nextState.kmlFiles = kf;
            break;
        }

        case actionApi.types.updateRoutes: {
            const a = action as DataAction<any>;
            nextState = Object.assign({}, state);
            nextState.routes = a.data;
            break;
        }

    }

    return nextState || state;
};


interface State {
    kmlFiles?: { id: string, xml: string }[];
    routes?: any[];
}


export { State };
