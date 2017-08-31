

import { State } from "../reducer/interfaces";
import * as React from "react";
import { connect } from "react-redux";
// import { Link, Route } from "react-router-dom";


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
        data = (<pre>{JSON.stringify(props.routes, null, 2)}</pre>);
    } else {
        data = (<h1>WORKING</h1>);
    }

    return (
        <div>
            {data}
        </div>
    );
};
