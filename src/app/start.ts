

// import { http } from "./network/http";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as redux from "redux";
import reduxThunk from "redux-thunk";
import Start from "./startView";


export default async () => {
    // Register our service worker.
    await navigator.serviceWorker.register("serviceWorker.js", { scope: "/" });

    // Since the HTML is automatically generated add an element where the React
    // components will be attached.
    const reactRoot = document.createElement("div");
    reactRoot.id = "react-root";
    document.body.appendChild(reactRoot);

    // Setup React, Redux, React-Router
    const middlewareArgs = [reduxThunk];
    const reduxMiddleware = redux.applyMiddleware(...middlewareArgs);
    const tempReducer = (state) => state;
    const store = redux.createStore(tempReducer, {}, reduxMiddleware);
    ReactDOM.render(React.createElement(Start, { store }), reactRoot);

    // TEMP
    // const url = `https://islandexplorertracker.availtec.com/InfoPoint/rest/Routes/GetVisibleRoutes?_${Date.now()}`;
    // const response = await http.get(url);
    // console.log("response: %O", response);
};
