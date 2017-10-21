

import { actionApi } from "../action/api";
import { BaseAction, DataAction, DataActionId } from "../action/interfaces";


export default (state: State = { routeGeos: [], routeStops: [] }, action: BaseAction): State => {
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

        case actionApi.types.updateStops: {
            const a = action as DataActionId<number, any>;

            // Only add the stop information if this route doesn't already
            // exist.
            const index = state.routeStops.findIndex(item => item.id === a.id);
            if (index < 0) {
                nextState = Object.assign({}, state);
                const rs = state.routeStops ? [...state.routeStops] : [];
                rs.push({ id: a.id, stops: a.data });
                nextState.routeStops = rs;
            }

            break;
        }

    }

    return nextState || state;
};


interface RouteGeo {
    id: string;
    geoJson: {
        features: any[];
    };
}

interface RouteStops {
    id: number;
    stops: any[];
}

interface State {
    routeGeos: RouteGeo[];
    routes?: any[];
    routeStops: RouteStops[];
}


export { RouteGeo, RouteStops, State };
