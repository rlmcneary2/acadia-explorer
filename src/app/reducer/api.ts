

import { actionApi } from "../action/api";
import { BaseAction, DataAction, } from "../action/interfaces";


export default (state: State = {}, action: BaseAction): State => {
    let nextState: State;

    switch (action.type) {

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
    routes?: any;
}


export { State };
