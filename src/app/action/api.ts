

import { DataAction } from "./interfaces";
import { RouteGeo } from "@reducer/api";


namespace actionApi {

    export const types = Object.freeze({
        updateRoutes: "updateRoutes",
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

}


export { actionApi };
