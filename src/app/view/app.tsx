

import Routes from "./routes";
import * as React from "react";
import { Link, Route } from "react-router-dom";
import { connect } from "react-redux";

export default connect()(state => {
    return (
        <div>
            <h1><Link to="/routes">Routes</Link></h1>
            <Route path="/routes" component={Routes} />
        </div>
    );
});
