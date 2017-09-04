

import routerData from "./router/routerData";
import * as React from "react";
import { Route } from "react-router-dom";
import { connect } from "react-redux";

export default connect()(props => {
    const routeProps = routerData.findData(props.location);

    return (
        <div>
            <Route {...routeProps} />
        </div>
    );
});
