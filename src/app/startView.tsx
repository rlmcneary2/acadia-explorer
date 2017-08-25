

import { Provider } from "react-redux";
import * as React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import App from "./view/app";


export default ({ store }) => {
    return (
        <Provider store={store}>
            <Router>
                <Route path="/" component={App} />
            </Router>
        </Provider>
    );
};
