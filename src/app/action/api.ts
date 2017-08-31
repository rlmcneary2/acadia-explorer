

import { DataAction } from "./interfaces";


namespace actionApi {

    export const types = Object.freeze({
        updateRoutes: "updateRoutes"
    });

    export function updateRoutes(data: any): DataAction<any> {
        return {
            data,
            type: actionApi.types.updateRoutes
        };
    }

}


export { actionApi };
