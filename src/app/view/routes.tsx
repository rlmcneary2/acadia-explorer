

import Button, { Props as ButtonProps } from "./common/routeButton";
import { State } from "../reducer/interfaces";
import * as React from "react";
import { connect } from "react-redux";


/**
 * The props for the presentational Routes component.
 * @interface Props
 */
interface Props {
    routes?: any;
}


// This is the container.
export default connect(mapStateToProps)((props: Props): JSX.Element => {
    return (<Routes {...props } />);
});

function mapStateToProps(state: State): Props {
    return state.api;
}


/**
 * This is the presentational component to display routes.
 * @param {Props} props 
 * @returns {JSX.Element} 
 */
const Routes = (props: Props): JSX.Element => {
    let data: JSX.Element = null;
    if (props.routes) {
        data = (
            <ul>
                {props.routes.map(item => { return createRouteItem.call(this, item); })}
            </ul>
        );
    } else {
        data = (<h1>WORKING</h1>);
    }

    return (
        <div>
            {data}
        </div>
    );
};


function createRouteItem(item: any): JSX.Element {
    const url: URL = new URL(window.location.href);
    url.pathname = `routes/${item.RouteId}`;

    const props: ButtonProps = {
        content: {
            id: item.LongName
        },
        url
    };

    return (
        <li key={item.RouteId}>
            <Button {...props} />
        </li>
    );
}
