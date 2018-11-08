/*
 * Copyright (c) 2017 Richard L. McNeary II
 *
 * MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


import * as React from "react";
import * as ReactDOM from "react-dom";
import * as redux from "redux";
// import { createLogger } from "redux-logger";
import reduxThunk from "redux-thunk";
import { actionApp } from "./action/app";
import { modules } from "./listener";
import { State } from "./reducer/interfaces";
import reducers from "./reducer/reducers";
import Start from "./startView";


export default async () => {
    // Register our service worker.
    // if (navigator.serviceWorker) {
    //     await navigator.serviceWorker.register("sw.js", { scope: "/" });
    // }

    // Setup React, Redux, React-Router
    // const json = localStorage.getItem("state");
    // const state = json ? JSON.parse(json) : {};

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
    //         prevState: () => "log"
    //     }
    // });
    // middlewareArgs.push(reduxLog);

    const reduxMiddleware = redux.applyMiddleware(...middlewareArgs);
    // const store = redux.createStore(reducers, state, reduxMiddleware);
    const store = redux.createStore<State>(reducers, reduxMiddleware);

    // Add listeners.
    for (const key of Object.keys(modules)) {
        store.subscribe(() => modules[key](store));
    }

    // Dispatch the initialize action.
    store.dispatch(actionApp.initialize());

    const reactRoot = document.getElementById("react-root");
    ReactDOM.render(React.createElement(Start, { store }), reactRoot);
};
