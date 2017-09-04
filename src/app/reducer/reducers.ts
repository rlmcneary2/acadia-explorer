

import api from "./api";
import http from "./http";
import { combineReducers } from "redux";
import ui from "./ui";


export default combineReducers({
    api,
    http,
    ui
});
