

import { DataAction } from "./interfaces";


namespace actionApi {

    export const types = Object.freeze({
        updateRoutes: "updateRoutes",
        updateKmlFiles: "updateKmlFiles"
    });

    export function updateKmlFiles(data: { id: string, xml: string }): DataAction<{ id: string, xml: string }> {
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
