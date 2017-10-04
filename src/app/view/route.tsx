

import { RouteGeo } from "@reducer/api";
import { State } from "@reducer/interfaces";
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
    if (props.route) {
        const mapProps: MapProps = {
            latitude: 44.3420759,
            layerId: props.route.RouteTraceFilename,
            layers: createMapGLLayers(props),
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


function createMapGLLayers(props: InternalProps): MapGLLayer[] {
    if (!props.routeGeos || props.routeGeos.length < 1) {
        return [];
    }

    return props.routeGeos.map(item => createMapGLLayer(props.route.RouteTraceFilename, item));
}

function createMapGLLayer(activeRouteId: string, routeGeo: RouteGeo) {
    const { id, geoJson: data } = routeGeo;
    const layer: MapGLLayer = {
        id,
        layout: {
            visibility: activeRouteId === id ? "visible" : "none"
        },
        type: "line",
        source: {
            data,
            type: "geojson"
        }
    };

    return layer;
}
