

import * as React from "react";
import { IntlProvider } from "react-intl";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Route } from "react-router-dom";
import App from "./view/app";


export default ({ store }) => {
    const locale = "en-US";
    const intlProps = {
        key: locale, // Set the key value to get React to re-render when the locale changes.
        locale
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
