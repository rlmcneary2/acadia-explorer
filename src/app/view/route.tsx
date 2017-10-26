

import mbx from "./MapBox/map";
import LinkButton, { Props as LinkButtonProps } from "@controls/linkButton";
import { RouteGeo, RouteStops } from "@reducer/api";
import { State } from "@reducer/interfaces";
import * as React from "react";
import { connect } from "react-redux";
import * as GeoJSON from "geojson";


const ROUTE_LINE_WIDTH = 8;
const START_LATITUDE = 44.3420759;
const START_LONGITUDE = -68.2654881;
const START_ZOOM = 10;


/**
 * The props for the presentational Route component.
 * @interface Props
 */
interface Props {
    location: {
        pathname: string;
    };
    match: {
        params: {
            id: string;
        };
        url: string;
    }; // Provided by redux-router
}

interface InternalProps extends Props {
    route?: any;
    routeGeos?: RouteGeo[];
    routeStops?: RouteStops[];
}


// This is the container.
export default connect(mapStateToProps)((props: InternalProps): JSX.Element => {
    return (<IslandExplorerRoute {...props } />);
});

function mapStateToProps(state: State, ownProps: Props): InternalProps {
    const { location, match } = ownProps;
    let route;
    if (state.api.routes && 0 < state.api.routes.length && match.params.id) {
        const routeId = parseInt(match.params.id);
        route = state.api.routes.find(item => item.RouteId === routeId);
    }

    const props: InternalProps = {
        location,
        match
    };

    if (route) {
        props.route = route;
    }

    if (state.api.routeGeos && 0 < state.api.routeGeos.length) {
        props.routeGeos = state.api.routeGeos;
    }

    if (state.api.routeStops && 0 < state.api.routeStops.length) {
        props.routeStops = state.api.routeStops;
    }

    return props;
}


/**
 * This is the presentational component to display a route.
 * @param {InternalProps} props 
 * @returns {JSX.Element} 
 */
const IslandExplorerRoute = (props: InternalProps): JSX.Element => {
    const isShowMap = !props.location.pathname.endsWith("info");
    let content = null;
    if (props.hasOwnProperty("route")) {
        const mapProps: mbx.Props = {
            background: {
                color: "#FFF",
                width: ROUTE_LINE_WIDTH + 6
            },
            isVisible: isShowMap,
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

        // It would be nice to use a react router Switch or Redirect here but we
        // need to keep the map component around and not replace it every time
        // the path changes to a new route. For that reason the URL will be
        // parsed here: if it ends with "info" the info page will be displayed
        // otherwise the map will be displayed.
        content = (
            <div className="route-content">
                <mbx.Map {...mapProps} />
                <h1 style={{ display: !isShowMap ? "initial" : "none" }}>Info please!</h1>
            </div>
        );
        // content = (<Redirect to={`/route/${props.match.params.id}/map`} />); // For historical purposes.
    } else {
        content = "WORKING";
    }

    const linkButtonProps: LinkButtonProps = {
        content: {
            id: !isShowMap ? "Map" : "Info"
        },
        to: !isShowMap ? `/route/${props.match.params.id}/map` : `/route/${props.match.params.id}/info`
    };

    return (
        <div className="content">
            <nav className="route-tabs">
                <LinkButton {...linkButtonProps} />
            </nav>
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

    let layers = props.routeGeos.map(item => createMapGLRouteLayer(props.route.RouteTraceFilename, item));
    if (props.routeStops && 0 < props.routeStops.length) {
        layers = [...layers, ...props.routeStops.map(item => createMapGLStopsLayer(props.route.RouteTraceFilename, props.route.RouteId, item))];
    }
    return layers;
}

function createMapGLRouteLayer(activeRouteId: string, routeGeo: RouteGeo) {
    const { id, geoJson } = routeGeo;
    const layer = mbx.createMapGLLayer(id, geoJson, activeRouteId === id ? "visible" : "none", activeRouteId === id);
    layer.paint["line-width"] = ROUTE_LINE_WIDTH;
    return layer;
}

function createMapGLStopsLayer(activeRouteId: string, activeRouteNumber: number, routeStops: RouteStops) {
    // Convert route stops to geojson points.
    const data = routeStops.stops.map(item => {
        const { Latitude: lat, Longitude: lng, Name: name } = item;
        return {
            lat,
            lng,
            name
        };
    });
    const geoJson = GeoJSON.parse(data, { extra: { icon: "circle" }, Point: ["lat", "lng"] });
    return mbx.createMapGLLayer(`${routeStops.id}_STOPS`, geoJson, activeRouteNumber === routeStops.id ? "visible" : "none", false);
}
