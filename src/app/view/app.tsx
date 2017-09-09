

import { ControlLinkContent } from "./common/controls/interfaces";
import Menu, { Props as MenuProps } from "./common/controls/menu";
import * as React from "react";
import { Route } from "react-router-dom";
import { connect } from "react-redux";
import { State } from "../reducer/interfaces";
import IslandExplorerRoute from "./route";
import Welcome from "./welcome";


interface Props {
    routes?: any[];
}


export default connect(mapStateToProps)(props => {
    const menu = createRoutesMenu(props);

    // const anyProps = props as any;
    // if (anyProps.location.pathname && (anyProps.location.pathname as string).indexOf("welcome") < 1) {
    //     setTimeout(() => {
    //         anyProps.history.push("/welcome");
    //     });
    // }

    return (
        <div className="application">
            {menu}
            <Route component={Welcome} path="/welcome" />
            <Route component={IslandExplorerRoute} path="/route/:id" />
        </div>
    );
});


function createRoutesMenu(props: Props): JSX.Element {
    if (!props.routes) {
        return (<div>WORKING</div>);
    }

    const items: ControlLinkContent[] = props.routes.map(item => {
        return {
            id: item.LongName,
            to: `/route/${item.RouteId}`
        };
    });

    const menuProps: MenuProps = {
        items
    };

    return (
        <Menu {...menuProps} />
    );
}

function mapStateToProps(state: State): Props {
    return state.api;
}
