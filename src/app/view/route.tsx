

import { State } from "../reducer/interfaces";
import * as React from "react";
import { connect } from "react-redux";
import Map, { Props as MapProps, MapGLLayer } from "@controls/map";


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
        // content = (<pre>{JSON.stringify(props.route, null, 2)}</pre>);
        const mapProps: MapProps = {
            latitude: 44.3420759,
            layers: [createMapGLLayer(props.route)],
            longitude: -68.2981852,
            zoom: 11
        };
        content = (<Map {...mapProps} />);
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


function createMapGLLayer(route) {
    const layer: MapGLLayer = {
        id: `${route.ShortName.toLowerCase()}-${route.RouteId}`,
        type: "line",
        source: {
            data: mapRouteIdToLayerData(route),
            type: "geojson"
        }
    };

    return layer;
}

function mapRouteIdToLayerData(route: any) {
    let data;
    switch (route.RouteId) {
        case 1: {
            data = require("../data/oceanarium.geo.json");
            break;
        }
    }

    return data;
}
