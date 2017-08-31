

import { State as ApiState } from "./api";
import { State as HttpState } from "./http";


interface State {
    api?: ApiState;
    http: HttpState;
}


export { State };
