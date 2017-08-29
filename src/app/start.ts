

import { actionApp } from "./action/app";
import * as React from "react";
import * as ReactDOM from "react-dom";
import reducers from "./reducer/reducers";
import * as redux from "redux";
import reduxThunk from "redux-thunk";
import Start from "./startView";


export default async () => {
    // Register our service worker.
    if (navigator.serviceWorker) {
        await navigator.serviceWorker.register("serviceWorker.js", { scope: "/" });
    }

    // Since the HTML is automatically generated add an element where the React
    // components will be attached.
    const reactRoot = document.createElement("div");
    reactRoot.id = "react-root";
    document.body.appendChild(reactRoot);

    // Setup React, Redux, React-Router
    const middlewareArgs = [reduxThunk];
    const reduxMiddleware = redux.applyMiddleware(...middlewareArgs);
    const store = redux.createStore(reducers, {}, reduxMiddleware);

    store.dispatch(actionApp.initialize());

    ReactDOM.render(React.createElement(Start, { store }), reactRoot);
};
