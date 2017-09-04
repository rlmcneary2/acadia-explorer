

import { State as ApiState } from "./api";
import { State as HttpState } from "./http";
import { State as UiState } from "./ui";


interface State {
    api?: ApiState;
    http: HttpState;
    ui?: UiState;
}


export { State };
