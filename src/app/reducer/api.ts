

import { actionApi } from "../action/api";
import { BaseAction, DataAction, } from "../action/interfaces";


export default (state: State = { routeGeos: [] }, action: BaseAction): State => {
    let nextState: State;

    switch (action.type) {

        case actionApi.types.updateKmlFiles: {
            const a = action as DataAction<RouteGeo>;

            // Only add the geojson information if this route doesn't already
            // exist.
            const index = state.routeGeos.findIndex(item => item.id === a.data.id);
            if (index < 0) {
                nextState = Object.assign({}, state);
                const rg = state.routeGeos ? [...state.routeGeos] : [];
                rg.push(a.data);
                nextState.routeGeos = rg;
            }

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


interface RouteGeo {
    id: string;
    geoJson: {};
}

interface State {
    routeGeos: RouteGeo[];
    routes?: any[];
}


export { RouteGeo, State };
