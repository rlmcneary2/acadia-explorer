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
import { actionUi } from "@action/ui";
import { TimerPie } from "@controls/timerPie";
import { RouteGeo, RouteStops, RouteVehicles } from "@reducer/api";
import { Route } from "@reducer/app";
import { State as ReduxState } from "@reducer/interfaces";
import { MapData } from "@reducer/ui";
import dateTime from "@util/dateTime";
import logg from "@util/logg";
/* tslint:disable-next-line: no-submodule-imports */
import * as GeoJSON from "geojson/geojson"; // There is a name collision here, this line must exist to import the geojson package (not an @types package).
import * as momentObj from "moment";
import * as React from "react";
import { FormattedDate, FormattedMessage } from "react-intl";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Props as MapProps, ReactMapboxGL, RmbxLayer } from "./MapBox/mapboxgl";
import RouteInfo, { Props as RouteInfoProps } from "./routeInfo";


const moment = (momentObj as any).default;
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
    mapData: MapData;
    nextTick?: number;
    onMapChanged: (data: MapData) => void;
    route?: any;
    routeChanged: (routeId: number) => void;
    /** This is supplemental data provided via a JSON file found in the "data" directory. */
    routeData?: Route[];
    routeGeos: RouteGeo[];
    routeStops: RouteStops[];
    routeVehicles: RouteVehicles[];
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
    nextTick?: number;
    routeChanged: boolean;
}


// This is the container.
export default connect(mapStateToProps, mapDispatchToProps)((props: InternalProps): JSX.Element => {
    return (<IslandExplorerRoute {...props} />);
});

function mapStateToProps(state: ReduxState, ownProps: Props): InternalProps {
    const { location, match } = ownProps;
    let route;
    const routeId = match.params.id ? parseInt(match.params.id, 10) : -1;
    if (state.api.routes && 0 < state.api.routes.length && -1 < routeId) {
        route = state.api.routes.find(item => item.RouteId === routeId);
    }

    const { routeGeos = [], routeStops = [], routeVehicles = [] } = state.api || {};

    // InternalProps - the callback functions are added by mapDispatchToProps.
    const props: InternalProps = {
        location,
        match,
        route,
        routeGeos,
        routeStops,
        routeVehicles
    } as any;

    if (state.ui.mapData) {
        props.mapData = state.ui.mapData;
    }

    if (state.tick && state.tick.ticks && state.tick.ticks.length) {
        props.nextTick = state.tick.ticks[0].startTime + state.tick.ticks[0].interval;
    }

    if (state.app && state.app && -1 < routeId) {
        props.routeData = state.app.routes;
    }

    return props;
}

function mapDispatchToProps(dispatch: ThunkDispatch<State, null, any>): InternalProps {
    const dispatchProps = {

        componentWillUnmount(props: InternalProps) {
            // TODO: remove bus locations for ACTION_ADD_BUSES_REQUEST.
            logg.debug(() => "TODO: remove bus locations for ACTION_ADD_BUSES_REQUEST.");
        },

        onMapChanged(data: MapData) {
            dispatch(actionUi.setMapData(data));
        },

        routeChanged(routeId: number) {
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
        this.state = { routeChanged: false };
    }


    public state: State;


    public componentDidMount() {
        this.onMapLoadedBound = this.onMapLoaded.bind(this);
    }

    public componentWillUnmount() {
        if (this.onMapLoadedBound !== null) {
            this.onMapLoadedBound = null;
        }

        this.props.componentWillUnmount(this.props);
    }

    public static getDerivedStateFromProps(props: InternalProps, state: State) {
        logg.debug(() => ["IslandExplorerRoute getDerivedStateFromProps - props: %O", props], IslandExplorerRoute.loggCategory);
        const { route } = props;
        if (!route) {
            return null;
        }

        const { RouteId: propsRouteId } = route;
        const stateRouteId = state.activeRoute ? state.activeRoute.id : null;

        // routeChanged will be updated only in this function.
        let nextState: State = { routeChanged: false };
        if (
            propsRouteId !== stateRouteId
        ) {
            const { Color: color, RouteId: id, ShortName: shortName } = props.route;

            // The route is changing so notify ourselves - once - that the route
            // has changed.
            nextState = { activeRoute: { color, id, shortName }, routeChanged: true };

            // Invoke action to send the bus location request and stop any existing
            // bus location requests. This action should take: a request ID (string)
            // the route ID (number). The request ID will identify that the route
            // component made the request and can only change its own request.
            props.routeChanged(propsRouteId);
        }

        if (props.nextTick) {
            nextState.nextTick = props.nextTick;
        }

        return nextState;
    }

    public render(): JSX.Element {
        logg.debug(() => ["IslandExplorerRoute render - props: %O", this.props], IslandExplorerRoute.loggCategory);
        const isShowMap = !this.props.location.pathname.endsWith("info");
        let content = null;
        if (this.props.hasOwnProperty("route")) {
            const layers = this._createMapGLLayers();
            const sources = this.createSources();
            const center = this.props.mapData ? [this.props.mapData.center.lng, this.props.mapData.center.lat] : [START_LONGITUDE, START_LATITUDE];
            const zoom =  this.props.mapData ? this.props.mapData.zoom : START_ZOOM;

            const mapProps: MapProps = {
                accessToken: "pk.eyJ1IjoicmxtY25lYXJ5MiIsImEiOiJjajgyZjJuMDAyajJrMndzNmJqZDFucTIzIn0.BYE_k7mYhhVCdLckWeTg0g",
                boundsPadding: ZOOM_TO_FIT_PADDING,
                onLoaded: this.onMapLoadedBound,
                onMapChanged: data => this.props.onMapChanged(data as any),
                onMarkerClicked: properties => alert(JSON.stringify(properties)),
                options: {
                    attributionControl: false,
                    center,
                    style: "mapbox://styles/mapbox/outdoors-v10",
                    zoom
                },
                visible: isShowMap
            };

            // Use the information about layers in state to determine which
            // layer is visible on the map.
            const activeRouteId = this._getActiveRouteId();
            logg.debug(() => ["IslandExplorerRoute render - state.activeRoute: %O", activeRouteId], IslandExplorerRoute.loggCategory);
            const routeId = this._routeLayerId(activeRouteId);
            if (routeId !== null && layers) {
                const updateLayer = (id: string, visibility: string): RmbxLayer => {
                    const layer = layers.get(id);
                    if (layer) {
                        layer.layoutProperties = layer.layoutProperties || {};
                        layer.layoutProperties.visibility = visibility as any;
                    }

                    return layer;
                };

                for (const id of layers.keys()) {
                    if (id !== routeId) {
                        continue;
                    }

                    const visibility = "visible";
                    const l = updateLayer(id, visibility);
                    l.bounds = true; // The route "trace" layer is used to determine the bounds to be displayed.
                    // This will only happen when the application is first
                    // started and no mapData is in localStorage.
                    if (!this.props.mapData) {
                        l.boundsForce = true;
                    }
                    updateLayer(this._stopsLayerId(id), visibility);
                    updateLayer(this._stopsLayerId(id, true), visibility);
                    updateLayer(this._vehiclesLayerId(id), visibility);
                }
            }

            let countdown = null;
            if (isShowMap && this.state.nextTick) {
                countdown = (<TimerPie countDown={true} expiresMs={this.state.nextTick} spanMs={15 * 1000} refreshMs={1000} />);
            }

            const vehicleStatus = isShowMap ? this.vehicleStatus(activeRouteId) : null;


            let routeInfoProps: RouteInfoProps = null;
            if (!isShowMap && this.props.route && this.props.routeData) {
                const route = this.props.routeData.find(x => x.id === this.props.route.RouteId);
                if (route) {
                    routeInfoProps = { route };
                }
            }


            // It would be nice to use a react router Switch or Redirect here but we
            // need to keep the map component around and not replace it every time
            // the path changes to a new route. For that reason the URL will be
            // parsed here: if it ends with "info" the info page will be displayed
            // otherwise the map will be displayed.
            content = (
                <div className="route-content">
                    <ReactMapboxGL
                        {...mapProps}
                        layers={layers}
                        sources={sources}
                    />
                    {vehicleStatus}
                    {countdown}
                    {routeInfoProps !== null ? <RouteInfo {...routeInfoProps} /> : null}
                </div>
            );
        } else {
            content = "WORKING";
        }

        return (
            <div className="content">
                {content}
            </div>
        );
    }


    private static readonly loggCategory = "iert";
    private mapLoaded = false;
    private onMapLoadedBound: () => void = null;


    private createSources(): Map<string, mapboxgl.GeoJSONSource> {
        const sources = new Map<string, mapboxgl.GeoJSONSource>();

        let layer: mapboxgl.Layer;
        let source: mapboxgl.GeoJSONSource;
        if (this.props.routeVehicles && this.props.routeVehicles.length) {
            const color = "#ff00fa";
            for (const rv of this.props.routeVehicles) {
                if (this.state.activeRoute.id !== rv.id) {
                    continue;
                }

                if (rv.vehicles && rv.vehicles.length) {
                    ({ layer } = this._createMapGLVehiclesLayer(rv, color));
                    ({ source } = layer as any);
                    sources.set(layer.id, source);
                }
            }
        }

        return sources;
    }

    private _createMapGLLayers(layers = new Map<string, RmbxLayer>()): Map<string, RmbxLayer> {
        const activeRouteId = this._getActiveRouteId();
        if (activeRouteId === null) {
            return null;
        }

        const colors = new Map<number, any>();
        let mbxLayer: RmbxLayer;
        if (this.props.routeGeos && this.props.routeGeos.length) {
            for (const rg of this.props.routeGeos) {
                if (activeRouteId !== rg.id) {
                    continue;
                }

                mbxLayer = this._createMapGLRouteLayer(rg);
                layers.set(mbxLayer.layer.id, mbxLayer);
                colors.set(rg.id, mbxLayer.layer.paint["line-color"]);
            }
        }

        if (this.props.routeStops && this.props.routeStops.length) {
            let color: string;
            for (const rs of this.props.routeStops) {
                if (activeRouteId !== rs.id) {
                    continue;
                }

                color = colors.get(rs.id);
                mbxLayer = this._createMapGLStopsLayer(rs, color);
                layers.set(mbxLayer.layer.id, mbxLayer);

                mbxLayer = this._createMapGLStopsTextLayer(rs, color);
                layers.set(mbxLayer.layer.id, mbxLayer);
            }
        }

        return layers;
    }

    private _createMapGLRouteLayer(routeGeo: RouteGeo): RmbxLayer {
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

        return { layer };
    }

    private _createMapGLStopsLayer(routeStops: RouteStops, color: string): RmbxLayer {
        this._stopsLayerId(routeStops.id);
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

        return { layer };
    }

    private _createMapGLStopsTextLayer(routeStops: RouteStops, color: string): RmbxLayer {
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

        return { layer };
    }

    private _createMapGLVehiclesLayer(routeVehicles: RouteVehicles, color: string): RmbxLayer {
        // Convert route stops to geojson points.
        const data = routeVehicles.vehicles.map(item => {
            logg.debug(() => ["IslandExplorerRoute _createMapGLVehiclesLayer - vehicle data. %O", item], IslandExplorerRoute.loggCategory);
            const { CommStatus, DirectionLong: direction, Heading: heading, LastStop: lastStop, Latitude: lat, Longitude: lng, Name: name, RunId: runId, TripId: tripId, VehicleId: vehicle } = item;

            let nextScheduledStop: string;
            if (
                this.state.activeRoute &&
                this.props.routeStops &&
                this.props.routeData &&
                this.props.routeData[`${this.state.activeRoute.id}`]
            ) {
                // Find the next scheduled stop.
                const routeData = this.props.routeData[`${this.state.activeRoute.id}`];
                const acadiaNow = moment(dateTime.getLocationTime());
                let currentStopData: { ids: number[]; };
                for (const stopData of routeData.scheduledStops || []) {
                    const begin = moment(stopData.dates.begin);
                    const end = moment(stopData.dates.end);
                    if (acadiaNow.isBefore(begin) || end.isBefore(acadiaNow)) {
                        continue;
                    }

                    const first = moment(stopData.hours.first);
                    const last = moment(stopData.hours.last);
                    if (acadiaNow.isBefore(first) || last.isBefore(acadiaNow)) {
                        continue;
                    }

                    currentStopData = stopData;
                    break;
                }

                // Now have the list of scheduled stops that are currently in effect.
                if (currentStopData) {
                    // Get the stops for this route.
                    const routeStops = this.props.routeStops.find(s => s.id === this.state.activeRoute.id);

                    // TODO: find the next stop that matches an ID in the
                    // currentStopData. Should at least always match the last
                    // stop right? 
                    let nextStopObj: { StopId: number; Name: string; };
                    if (routeStops) {
                        let lastStopIndex = routeStops.stops.findIndex(s => s.Name === lastStop) + 1;
                        for (; lastStopIndex < routeStops.stops.length; lastStopIndex++) {
                            nextStopObj = routeStops.stops[lastStopIndex];
                            if (currentStopData.ids.some(s => s === nextStopObj.StopId)) {
                                break;
                            }
                        }
                    }

                    nextScheduledStop = nextStopObj ? nextStopObj.Name : null;
                }
            }

            // These properties will be returned to the handler when a vehicle
            // marker is clicked by the user.
            return {
                communicating: CommStatus === "GOOD",
                direction,
                heading,
                lastStop,
                lat,
                lng,
                name,
                nextScheduledStop,
                runId,
                tripId,
                vehicle
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

        return { layer };
    }

    private _getActiveRouteId(): number {
        if (this.props.route) {
            return this.props.route.RouteId;
        }

        return null;
    }

    private _routeLayerId(id: number): string {
        return `${id}`;
    }

    private _stopsLayerId(id: number | string, isLabelLayer = false): string {
        return `${id}_STOPS${isLabelLayer ? "_LABELS" : ""}`;
    }

    private _vehiclesLayerId(id: number | string, isLabelLayer = false): string {
        return `${id}_VEHICLES${isLabelLayer ? "_LABELS" : ""}`;
    }

    private onMapLoaded() {
        logg.info(() => "IslandExplorerRoute onMapLoaded - map loaded.", IslandExplorerRoute.loggCategory);
        this.mapLoaded = true;
    }

    private vehicleStatus(routeId: number): JSX.Element {
        if (!this.mapLoaded) {
            return null;
        }

        // When the route changes don't even try and create the vehicle status
        // because it will probably be wrong.
        if (this.state.routeChanged) {
            return null;
        }

        const { routeVehicles: routesVehicles = [] } = this.props;
        const routeVehicles: RouteVehicles = routesVehicles.find(item => item.id === routeId) || { id: routeId , vehicles: [] };
        const count = routeVehicles.vehicles.length;

        if (count) {
            return null;
        }

        // Is the schedule for this route finished? routeData is the
        // supplemental data provided in a JSON file.
        const { routeData = {} } = this.props;
        const route = routeData[routeId];

        let status: JSX.Element = null;
        if (route) {
            const stops = dateTime.getCurrentStops(route ? route.scheduledStops : []);
            if (stops) {
                // Vehicles are scheduled for this time but there are none for some reason...
                status = (<FormattedMessage id="ROUTE-NO_VEHICLES" />);
            } else {
                // No vehicles are scheduled for this route at this time.
                const resumes = dateTime.serviceResumes(route.scheduledStops);
                const year = moment(resumes.schedule.dates.begin).add(1, "year").year();
                status =
                    resumes.isNextYear ?
                        (<FormattedMessage id="ROUTE-RESUMES_NEXT_YEAR" values={{ year }} />) :
                        (<React.Fragment><FormattedMessage id="ROUTE-RESUMES_ON" /><FormattedDate value={resumes.date.toDate()} /></React.Fragment>);
            }
        } else {
            status = (<FormattedMessage id="ROUTE-NO_VEHICLES" />);
        }

        if (status) {
            status = (<div className="vehicle-status">{status}</div>);
        }

        return status;
    }

}


export { Props };
