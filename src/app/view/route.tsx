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


import mbx from "./MapBox/map";
import LinkButton, { Props as LinkButtonProps } from "@controls/linkButton";
import { RouteGeo, RouteStops } from "@reducer/api";
import { State as ReduxState } from "@reducer/interfaces";
import * as React from "react";
import { connect } from "react-redux";
import * as GeoJSON from "geojson";


const ROUTE_LINE_WIDTH = 8;
const START_LATITUDE = 44.3420759;
const START_LONGITUDE = -68.2654881;
const START_ZOOM = 10;
const ZOOM_TO_FIT_PADDING = 100;


interface InternalProps extends Props {
    route?: any;
    routeGeos?: RouteGeo[];
    routeStops?: RouteStops[];
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
    activeRoute: {
        color: any;
        id: number;
        shortName: string;
    };
    layers: Map<string, LayerProps>;
}


// This is the container.
export default connect(mapStateToProps)((props: InternalProps): JSX.Element => {
    return (<IslandExplorerRoute {...props } />);
});

function mapStateToProps(state: ReduxState, ownProps: Props): InternalProps {
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
 */
class IslandExplorerRoute extends React.Component<InternalProps, State> {

    constructor() {
        super();
        this.state = { activeRoute: { color: "", id: -1, shortName: "" }, layers: new Map<string, LayerProps>() };
    }

    public componentWillMount() {
        this._mapIsInitializedHandlerBound = this._mapIsInitializedHandler.bind(this);
    }

    public componentWillReceiveProps(nextProps: InternalProps) {
        if (
            nextProps.hasOwnProperty("route") &&
            nextProps.route.RouteId !== this.state.activeRoute.id
        ) {
            const { Color: color, RouteId: id, ShortName: shortName } = nextProps.route;
            this.setState({ activeRoute: { color, id, shortName } });
        }
    }

    public componentWillUnmount() {
        this._mapIsInitializedHandlerBound = null;
    }

    public render(): JSX.Element {
        const isShowMap = !this.props.location.pathname.endsWith("info");
        let content = null;
        if (this.props.hasOwnProperty("route")) {
            const mapProps: mbx.Props = {
                background: {
                    color: "#FFF",
                    width: ROUTE_LINE_WIDTH + 6
                },
                mapIsInitialized: this._mapIsInitializedHandlerBound,
                isVisible: isShowMap,
                latitude: START_LATITUDE,
                longitude: START_LONGITUDE,
                zoom: START_ZOOM,
                zoomToFit: true,
                zoomToFitPadding: ZOOM_TO_FIT_PADDING
            };

            // Layers only passed to the Map component once so eventually the
            // mapProps.layers will be an empty array.
            mapProps.layers = this._createMapGLLayers();

            // Use the information about layers in state to determine which
            // layer is visible on the map.
            if (this.state.activeRoute && this.state.activeRoute.id) {
                const visibleLayersIds: string[] = [];
                this.state.layers
                    .forEach(item => {
                        if (item.id === this.state.activeRoute.id) {
                            visibleLayersIds.push(this._routeLayerId(item.id));
                            visibleLayersIds.push(this._stopsLayerId(item.id));
                            visibleLayersIds.push(this._stopsLayerId(item.id, true));
                        }
                    });

                if (0 < visibleLayersIds.length) {
                    mapProps.visibleLayersIds = visibleLayersIds;
                }

                mapProps.zoomToLayerId = this._routeLayerId(this.state.activeRoute.id);
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

    public state: State;


    private _createMapGLLayers(): mbx.MapGLLayer[] {
        if (!this._mapInitialized) {
            return [];
        }

        const layers: mbx.MapGLLayer[] = [];
        if (this.props.routeGeos && 0 < this.props.routeGeos.length) {
            let rg: RouteGeo;
            let layer: mbx.MapGLLayer;
            for (let i = 0; i < this.props.routeGeos.length; i++) {
                rg = this.props.routeGeos[i];

                if (!this.state.layers.has(this._routeLayerId(rg.id))) {
                    layer = this._createMapGLRouteLayer(rg);
                    layers.push(layer);
                    this.state.layers.set(this._routeLayerId(rg.id), { color: layer.paint["line-color"], id: rg.id });
                }
            }
        }

        if (this.props.routeStops && this.props.routeStops.length) {
            let color: string;
            for (let i = 0; i < this.props.routeStops.length; i++) {
                const rs = this.props.routeStops[i];
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

        return layers;
    }

    private _createMapGLRouteLayer(routeGeo: RouteGeo) {
        const { geoJson } = routeGeo;
        const feature = geoJson && geoJson.features && 0 < geoJson.features.length ? geoJson.features[0] : null;
        const layer: mbx.MapGLLayer = {
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
            type: "line",
            source: {
                data: geoJson,
                type: "geojson"
            }
        };

        return layer;
    }

    private _createMapGLStopsLayer(routeStops: RouteStops, color: string) {
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

        const paint: mbx.MapGLLayerCirclePaint = {
            "circle-color": color,
            "circle-radius": {
                base: 1.25,
                stops: [[10, 11], [14, 12]]
            },
            "circle-stroke-color": "#FFF",
            "circle-stroke-opacity": 0.8,
            "circle-stroke-width": {
                base: 1.25,
                stops: [[10, 7], [14, 8]]
            }
        };

        const layer: mbx.MapGLLayer = {
            id: this._stopsLayerId(routeStops.id),
            layout: {},
            paint,
            type: "circle",
            source: {
                data: geoJson,
                type: "geojson"
            }
        };

        return layer;
    }

    private _createMapGLStopsTextLayer(routeStops: RouteStops, color: string) {
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

        const paint: mbx.MapGLLayerSymbolPaint = {
            "text-halo-blur": 1,
            "text-halo-color": "#FFF",
            "text-halo-width": 6
        };

        const layer: mbx.MapGLLayer = {
            id: this._stopsLayerId(routeStops.id, true),
            layout: {
                "icon-allow-overlap": true,
                "icon-optional": true,
                // "text-allow-overlap": true,
                "text-anchor": "top",
                "text-field": "{name}",
                "text-offset": [0, 1],
                "text-size": {
                    base: 1.25,
                    stops: [[10, 25], [14, 40]]
                }
            },
            paint,
            type: "symbol",
            source: {
                data: geoJson,
                type: "geojson"
            }
        };

        return layer;
    }

    private _mapInitialized = false;

    private _mapIsInitializedHandler() {
        this._mapInitialized = true;
        this.forceUpdate();
    }

    private _mapIsInitializedHandlerBound: () => void;

    private _routeLayerId(id: number): string {
        return `${id}`;
    }

    private _stopsLayerId(id: number, isLabelLayer = false): string {
        return `${id}_STOPS${isLabelLayer ? "_LABELS" : ""}`;
    }

}


export { Props };
