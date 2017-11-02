

import { actionApp } from "./action/app";
import apiListener from "./api/listener";
import * as React from "react";
import * as ReactDOM from "react-dom";
import reducers from "./reducer/reducers";
import * as redux from "redux";
// import { createLogger } from "redux-logger";
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

    // Should not be in production.
    // const reduxLog = createLogger({
    //     colors: {
    //         action: () => "blue",
    //         error: () => "blue",
    //         nextState: () => "blue",
    //         prevState: () => "blue",
    //         title: () => "blue"
    //     },
    //     level: {
    //         action: () => "log",
    //         error: () => "log",
    //         nextState: () => "log",
    //         prevState: () => "log",
    //     }
    // });
    // middlewareArgs.push(reduxLog);

    const reduxMiddleware = redux.applyMiddleware(...middlewareArgs);
    const store = redux.createStore(reducers, {}, reduxMiddleware);

    // Add listeners.
    store.subscribe(() => apiListener(store));

    // Dispatch the initialize action.
    store.dispatch(actionApp.initialize());

    ReactDOM.render(React.createElement(Start, { store }), reactRoot);
};
