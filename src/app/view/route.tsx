

// import Button, { Props as ButtonProps } from "./common/routeButton";
import { State } from "../reducer/interfaces";
import * as React from "react";
import { connect } from "react-redux";


/**
 * The props for the presentational Route component.
 * @interface Props
 */
interface Props {
    match: any; // Provided by redux-router
}

interface InternalProps extends Props {
    route?: any;
}


// This is the container.
export default connect(mapStateToProps)((props: InternalProps): JSX.Element => {
    return (<Route {...props } />);
});

function mapStateToProps(state: State, ownProps: Props): InternalProps {
    const { match } = ownProps;
    let route;
    if (state.api.routes && 0 < state.api.routes.length && match.params.id) {
        const routeId = parseInt(match.params.id);
        route = state.api.routes.find(item => item.RouteId === routeId);
    }

    const props: InternalProps = {
        match
    };

    if (route) {
        props.route = route;
    }

    return props;
}


/**
 * This is the presentational component to display a route.
 * @param {InternalProps} props 
 * @returns {JSX.Element} 
 */
const Route = (props: InternalProps): JSX.Element => {
    let content = null;
    if (props.route) {
        content = (<pre>{JSON.stringify(props.route, null, 2)}</pre>);
    } else {
        content = "WORKING";
    }

    return (
        <div className="content">
            {content}
        </div>
    );
};


export { Props };
