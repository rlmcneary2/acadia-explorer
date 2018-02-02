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


import { actionApp } from "./action/app";
import apiListener from "./api/listener";
import * as React from "react";
import * as ReactDOM from "react-dom";
import reducers from "./reducer/reducers";
import * as redux from "redux";
import { createLogger } from "redux-logger";
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
    const reduxLog = createLogger({
        colors: {
            action: () => "blue",
            error: () => "blue",
            nextState: () => "blue",
            prevState: () => "blue",
            title: () => "blue"
        },
        level: {
            action: () => "log",
            error: () => "log",
            nextState: () => "log",
            prevState: () => "log",
        }
    });
    middlewareArgs.push(reduxLog);

    const reduxMiddleware = redux.applyMiddleware(...middlewareArgs);
    const store = redux.createStore(reducers, {}, reduxMiddleware);

    // Add listeners.
    store.subscribe(() => apiListener(store));

    // Dispatch the initialize action.
    store.dispatch(actionApp.initialize());

    ReactDOM.render(React.createElement(Start, { store }), reactRoot);
};
