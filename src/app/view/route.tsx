/*
 * Copyright (c) 2017 Richard L. McNeary II
 *
 * MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


import { actionApi } from "@action/api";
import LinkButton, { Props as LinkButtonProps } from "@controls/linkButton";
import { RouteGeo, RouteStops, RouteVehicles } from "@reducer/api";
import { State as ReduxState } from "@reducer/interfaces";
import logg from "@util/logg";
/* tslint:disable-next-line: no-submodule-imports */
import * as GeoJSON from "geojson/geojson"; // There is a name collision here, this line must exist to import the geojson package (not an @types package).
import * as React from "react";
import { connect } from "react-redux";
import * as redux from "redux";
import { Map as MapboxMap, Props as MapboxProps } from "./MapBox/map";


const ROUTE_LINE_WIDTH = 4;
const START_LATITUDE = 44.3420759;
const START_LONGITUDE = -68.2654881;
const START_ZOOM = 8.5;
const STOP_CIRCLE_RADIUS_BASE = 1.15;
const STOP_CIRCLE_RADIUS_STEPS: ReadonlyArray<ReadonlyArray<number>> = [[10, 5], [14, 5]];
const STOP_CIRCLE_STROKE_BASE = 1.15;
const STOP_CIRCLE_STROKE_STEPS: ReadonlyArray<ReadonlyArray<number>> = [[10, 3], [14, 3]];
const STOP_TEXT_BASE = 1.15;
const STOP_TEXT_STEPS: ReadonlyArray<ReadonlyArray<number>> = [[10, 10], [14, 12]];
const ZOOM_TO_FIT_PADDING = 25;


interface InternalProps extends Props {
    componentWillUnmount: (props: InternalProps) => void;
    route?: any;
    routeChanged: (routeId: number) => void;
    routeGeos: RouteGeo[];
    routeStops: RouteStops[];
    routeVehicles: RouteVehicles[];
}

interface LayerProps {
    color?: string;
    id: number;
}

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

interface State {
    activeRoute?: {
        color: any;
        id: number;
        shortName: string;
    };
    layers: Map<string, LayerProps>;
}


// This is the container.
export default connect(mapStateToProps, mapDispatchToProps)((props: InternalProps): JSX.Element => {
    return (<IslandExplorerRoute {...props} />);
});

function mapStateToProps(state: ReduxState, ownProps: Props): InternalProps {
    const { location, match } = ownProps;
    let route;
    if (state.api.routes && 0 < state.api.routes.length && match.params.id) {
        const routeId = parseInt(match.params.id, 10);
        route = state.api.routes.find(item => item.RouteId === routeId);
    }

    const { routeGeos = [], routeStops = [], routeVehicles = [] } = state.api || {};

    // InternalProps - the callback functions are added by mapDispatchToProps.
    const props: any = {
        location,
        match,
        route,
        routeGeos,
        routeStops,
        routeVehicles
    };

    return props;
}

function mapDispatchToProps(dispatch: redux.Dispatch<any>): InternalProps {
    const dispatchProps = {

        componentWillUnmount: (props: InternalProps) => {
            // TODO: remove bus locations for ACTION_ADD_BUSES_REQUEST.
            logg.debug(() => "TODO: remove bus locations for ACTION_ADD_BUSES_REQUEST.");
        },

        routeChanged: (routeId: number) => {
            dispatch(actionApi.getVehicles([routeId]) as any);
        }

    };

    return dispatchProps as InternalProps;
}


/**
 * This is the presentational component to display a route.
 */
class IslandExplorerRoute extends React.Component<InternalProps, State> {

    constructor(props: InternalProps) {
        super(props);
        this.state = { layers: new Map<string, LayerProps>() };
    }


    public state: State;

    public componentWillMount() {
        this.mapIsInitializedHandlerBound = this._mapIsInitializedHandler.bind(this);
    }

    public componentWillReceiveProps(nextProps: InternalProps) {
        logg.debug(() => ["route componentWillReceiveProps - nextProps: %O", nextProps]);
        if (
            nextProps.hasOwnProperty("route") &&
            !this.state.activeRoute ||
            (this.state.activeRoute && nextProps.route.RouteId !== this.state.activeRoute.id)
        ) {
            const { Color: color, RouteId: id, ShortName: shortName } = nextProps.route;
            this.setState({ activeRoute: { color, id, shortName } });

            // TODO: kickoff request for the locations of buses on this route. When
            // does the request for bus locations stop? First when another route is
            // chosen. Second when the route component is being unmounted.

            // Invoke action to send the bus location request and stop any existing
            // bus location requests. This action should take: a request ID (string)
            // the route ID (number). The request ID will identify that the route
            // component made the request and can only change its own request.
            nextProps.routeChanged(nextProps.route.RouteId);
        }
    }

    public componentWillUnmount() {
        this.mapIsInitializedHandlerBound = null;
        this.props.componentWillUnmount(this.props);
    }

    public render(): JSX.Element {
        logg.debug(() => ["route render - props: %O", this.props]);
        const isShowMap = !this.props.location.pathname.endsWith("info");
        let content = null;
        if (this.props.hasOwnProperty("route")) {
            const mapProps: MapboxProps = {
                background: {
                    color: "#FFF",
                    width: ROUTE_LINE_WIDTH + 6
                },
                isVisible: isShowMap,
                latitude: START_LATITUDE,
                longitude: START_LONGITUDE,
                mapIsInitialized: this.mapIsInitializedHandlerBound,
                zoom: START_ZOOM,
                zoomToFit: true,
                zoomToFitPadding: ZOOM_TO_FIT_PADDING
            } as any;

            // Layers only passed to the Map component once so eventually the
            // mapProps.layers will be an empty array.
            mapProps.layers = this._createMapGLLayers();

            // Use the information about layers in state to determine which
            // layer is visible on the map.
            logg.info(() => ["route render - state.activeRoute: %O", this.state.activeRoute]);
            const routeId = this._getActiveRouteId();
            if (routeId !== null) {
                const visibleLayersIds: string[] = [];
                this.state.layers
                    .forEach(item => {
                        if (item.id === routeId) {
                            visibleLayersIds.push(this._routeLayerId(item.id));
                            visibleLayersIds.push(this._stopsLayerId(item.id));
                            visibleLayersIds.push(this._stopsLayerId(item.id, true));
                            visibleLayersIds.push(this._vehiclesLayerId(item.id));

                            // The route "trace" layer is used to determine the
                            // bounds to be displayed.
                            mapProps.boundsLayerId = this._routeLayerId(item.id);
                        }
                    });

                if (0 < visibleLayersIds.length) {
                    mapProps.visibleLayersIds = visibleLayersIds;
                }

                mapProps.zoomToLayerId = this._routeLayerId(routeId);
            }

            // It would be nice to use a react router Switch or Redirect here but we
            // need to keep the map component around and not replace it every time
            // the path changes to a new route. For that reason the URL will be
            // parsed here: if it ends with "info" the info page will be displayed
            // otherwise the map will be displayed.
            content = (
                <div className="route-content">
                    <MapboxMap {...mapProps} />
                    <h1 style={{ display: !isShowMap ? "initial" : "none" }}>Info please!</h1>
                </div>
            );
            // content = (<Redirect to={`/route/${props.match.params.id}/map`} />); // For historical purposes.
        } else {
            content = "WORKING";
        }

        const linkButtonProps: LinkButtonProps = {
            content: {
                id: !isShowMap ? "MAP" : "INFO"
            },
            to: !isShowMap ? `/route/${this.props.match.params.id}/map` : `/route/${this.props.match.params.id}/info`
        };

        return (
            <div className="content">
                <nav className="route-tabs">
                    <LinkButton {...linkButtonProps} />
                </nav>
                {content}
            </div>
        );
    }


    private mapInitialized = false;
    private mapIsInitializedHandlerBound: () => void;

    private _createMapGLLayers(): mapboxgl.Layer[] {
        if (!this.mapInitialized) {
            return [];
        }

        const layers: mapboxgl.Layer[] = [];
        if (this.props.routeGeos && this.props.routeGeos.length) {
            let layer: mapboxgl.Layer;
            for (const rg of this.props.routeGeos) {
                if (!this.state.layers.has(this._routeLayerId(rg.id))) {
                    layer = this._createMapGLRouteLayer(rg);
                    layers.push(layer);
                    this.state.layers.set(this._routeLayerId(rg.id), { color: layer.paint["line-color"], id: rg.id });
                }
            }
        }

        if (this.props.routeStops && this.props.routeStops.length) {
            let color: string;
            for (const rs of this.props.routeStops) {
                if (!this.state.layers.has(this._routeLayerId(rs.id))) {
                    continue;
                }

                if (this.state.layers.has(this._stopsLayerId(rs.id))) {
                    continue;
                }

                color = this.state.layers.get(this._routeLayerId(rs.id)).color;
                layers.push(this._createMapGLStopsLayer(rs, color));
                this.state.layers.set(this._stopsLayerId(rs.id), { id: rs.id });

                layers.push(this._createMapGLStopsTextLayer(rs, color));
                this.state.layers.set(this._stopsLayerId(rs.id, true), { id: rs.id });
            }
        }

        if (this.props.routeVehicles && this.props.routeVehicles.length) {
            const color = "#ff00fa";
            for (const rv of this.props.routeVehicles) {
                const { id } = rv;
                if (!this.state.layers.has(this._routeLayerId(id))) {
                    continue;
                }

                if (this.state.layers.has(this._vehiclesLayerId(id))) {
                    this.state.layers.delete(this._vehiclesLayerId(id));
                }

                if (rv.vehicles && rv.vehicles.length) {
                    layers.push(this._createMapGLVehiclesLayer(rv, color));
                    this.state.layers.set(this._vehiclesLayerId(id), { id });
                }
            }
        }

        return layers;
    }

    private _createMapGLRouteLayer(routeGeo: RouteGeo): mapboxgl.Layer {
        const { geoJson } = routeGeo;
        const feature = geoJson && geoJson.features && 0 < geoJson.features.length ? geoJson.features[0] : null;
        const layer: mapboxgl.Layer = {
            id: this._routeLayerId(routeGeo.id),
            layout: {
                "line-cap": "round",
                "line-join": "round"
            },
            paint: {
                "line-color": feature.properties.stroke || "#000",
                "line-opacity": feature.properties["stroke-opcaity"] || 1,
                "line-width": ROUTE_LINE_WIDTH
            },
            source: {
                data: geoJson,
                type: "geojson"
            },
            type: "line"
        };

        return layer;
    }

    private _createMapGLStopsLayer(routeStops: RouteStops, color: string): mapboxgl.Layer {
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

        const paint: mapboxgl.CirclePaint = {
            "circle-color": color,
            "circle-radius": {
                base: STOP_CIRCLE_RADIUS_BASE,
                stops: STOP_CIRCLE_RADIUS_STEPS as any[]
            },
            "circle-stroke-color": "#FFF",
            "circle-stroke-opacity": 0.8,
            "circle-stroke-width": {
                base: STOP_CIRCLE_STROKE_BASE,
                stops: STOP_CIRCLE_STROKE_STEPS as any[]
            }
        };

        const layer: mapboxgl.Layer = {
            id: this._stopsLayerId(routeStops.id),
            layout: {},
            paint,
            source: {
                data: geoJson,
                type: "geojson"
            },
            type: "circle"
        };

        return layer;
    }

    private _createMapGLStopsTextLayer(routeStops: RouteStops, color: string): mapboxgl.Layer {
        // Convert route stops to geojson points.
        const data = routeStops.stops.map(item => {
            const { Latitude: lat, Longitude: lng, Name: name } = item;
            return {
                lat,
                lng,
                name
            };
        });

        const geoJson = GeoJSON.parse(data, { Point: ["lat", "lng"] });

        const paint: mapboxgl.SymbolPaint = {
            "text-halo-blur": 1,
            "text-halo-color": "#FFF",
            "text-halo-width": 6
        };

        const layer: mapboxgl.Layer = {
            id: this._stopsLayerId(routeStops.id, true),
            layout: {
                "icon-allow-overlap": true,
                "icon-optional": true,
                // "text-allow-overlap": true,
                "text-anchor": "top",
                "text-field": "{name}",
                "text-offset": [0, 1],
                "text-size": {
                    base: STOP_TEXT_BASE,
                    stops: STOP_TEXT_STEPS as any[]
                }
            },
            paint,
            source: {
                data: geoJson,
                type: "geojson"
            },
            type: "symbol"
        };

        return layer;
    }

    private _createMapGLVehiclesLayer(routeVehicles: RouteVehicles, color: string): mapboxgl.Layer {
        // Convert route stops to geojson points.
        const data = routeVehicles.vehicles.map(item => {
            const { Latitude: lat, Longitude: lng, Name: name } = item;
            return {
                lat,
                lng,
                name
            };
        });

        const geoJson = GeoJSON.parse(data, { extra: { icon: "circle" }, Point: ["lat", "lng"] });

        const paint: mapboxgl.CirclePaint = {
            "circle-color": color,
            "circle-radius": {
                base: STOP_CIRCLE_RADIUS_BASE,
                stops: STOP_CIRCLE_RADIUS_STEPS as any[]
            },
            "circle-stroke-color": "#FFF",
            "circle-stroke-opacity": 0.8,
            "circle-stroke-width": {
                base: STOP_CIRCLE_STROKE_BASE,
                stops: STOP_CIRCLE_STROKE_STEPS as any[]
            }
        };

        const layer: mapboxgl.Layer = {
            id: this._vehiclesLayerId(routeVehicles.id),
            layout: {},
            metadata: { acadiaExplorer: { isVehicle: true } },
            paint,
            source: {
                data: geoJson,
                type: "geojson"
            },
            type: "circle"
        };

        return layer;
    }

    private _getActiveRouteId(): number {
        if (this.state.activeRoute) {
            return this.state.activeRoute.id;
        } else if (this.props.route) {
            return this.props.route.RouteId;
        }

        return null;
    }

    private _mapIsInitializedHandler() {
        this.mapInitialized = true;
        this.forceUpdate();
    }

    private _routeLayerId(id: number): string {
        return `${id}`;
    }

    private _stopsLayerId(id: number, isLabelLayer = false): string {
        return `${id}_STOPS${isLabelLayer ? "_LABELS" : ""}`;
    }

    private _vehiclesLayerId(id: number, isLabelLayer = false): string {
        return `${id}_VEHICLES${isLabelLayer ? "_LABELS" : ""}`;
    }

}


export { Props };
