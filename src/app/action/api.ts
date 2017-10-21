

import { DataAction, DataActionId } from "./interfaces";
import { RouteGeo } from "@reducer/api";


namespace actionApi {

    export const types = Object.freeze({
        updateRoutes: "updateRoutes",
        updateStops: "updateStops",
        updateKmlFiles: "updateKmlFiles"
    });

    export function updateKmlFiles(data: RouteGeo): DataAction<RouteGeo> {
        return {
            data,
            type: actionApi.types.updateKmlFiles
        };
    }

    export function updateRoutes(data: any): DataAction<any> {
        return {
            data,
            type: actionApi.types.updateRoutes
        };
    }

    export function updateStops(routeId: number, data): DataActionId<number, any> {
        return {
            id: routeId,
            data,
            type: actionApi.types.updateStops
        };
    }

}


export { actionApi };
