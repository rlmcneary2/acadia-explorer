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
import { IntlProvider } from "react-intl";
import { Provider, Store } from "react-redux";
import { BrowserRouter as Router, Route } from "react-router-dom";
import * as messages from "../../locale/en-US.json";
import { State } from "./reducer/interfaces";
import App from "./view/app";


export default ({ store }: { store: Store<State>; }) => {
    const locale = "en-US";
    const intlProps = {
        key: locale, // Set the key value to get React to re-render when the locale changes.
        locale,
        messages
    };

    return (
        <Provider store={store}>
            <IntlProvider {...intlProps}>
                <Router>
                    <Route path="/" component={App} />
                </Router>
            </IntlProvider>
        </Provider>
    );
};
