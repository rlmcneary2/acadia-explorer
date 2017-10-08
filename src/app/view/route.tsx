

import mbx from "./MapBox/map";
import { RouteGeo } from "@reducer/api";
import { State } from "@reducer/interfaces";
import * as React from "react";
import { connect } from "react-redux";


const ROUTE_LINE_WIDTH = 8;
const START_LATITUDE = 44.3420759;
const START_LONGITUDE = -68.2654881;
const START_ZOOM = 10;


/**
 * The props for the presentational Route component.
 * @interface Props
 */
interface Props {
    match: any; // Provided by redux-router
}

interface InternalProps extends Props {
    route?: any;
    routeGeos?: RouteGeo[];
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

    if (state.api.routeGeos && 0 < state.api.routeGeos.length) {
        props.routeGeos = state.api.routeGeos;
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
    if (props.hasOwnProperty("route")) {
        const mapProps: mbx.Props = {
            background: {
                color: "#FFF",
                width: ROUTE_LINE_WIDTH + 6
            },
            latitude: START_LATITUDE,
            layerId: props.route.RouteTraceFilename,
            longitude: START_LONGITUDE,
            zoom: START_ZOOM,
            zoomToFit: true,
            zoomToFitPadding: 40
        };

        if (props.route) {
            mapProps.layers = createMapGLLayers(props);
        }

        content = (<mbx.Map {...mapProps} />);
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


function createMapGLLayers(props: InternalProps): mbx.MapGLLayer[] {
    if (!props.routeGeos || props.routeGeos.length < 1) {
        return [];
    }

    if (!props.route) {
        return [];
    }

    return props.routeGeos.map(item => createMapGLLayer(props.route.RouteTraceFilename, item));
}

function createMapGLLayer(activeRouteId: string, routeGeo: RouteGeo) {
    const { id, geoJson } = routeGeo;
    const layer = mbx.createMapGLLayer(id, geoJson, activeRouteId === id ? "visible" : "none", activeRouteId === id);
    layer.paint["line-width"] = ROUTE_LINE_WIDTH;
    return layer;
}
