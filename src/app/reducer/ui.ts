

import { actionUi } from "../action/ui";
import { BaseAction, DataAction, } from "../action/interfaces";


export default (state: State = {}, action: BaseAction): State => {
    let nextState: State;

    switch (action.type) {

        case actionUi.types.setViewData: {
            const a = action as DataAction<any>;
            nextState = Object.assign({}, state);
            nextState.viewData = a.data;
            break;
        }

    }

    return nextState || state;
};


interface State {
    viewData?: any;
}


export { State };
