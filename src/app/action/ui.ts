

import { DataAction } from "./interfaces";


namespace actionUi {

    export const types = Object.freeze({
        setViewData: "setViewData"
    });

    export function setViewData(data: any): DataAction<any> {
        return {
            data,
            type: actionUi.types.setViewData
        };
    }

}


export { actionUi };
