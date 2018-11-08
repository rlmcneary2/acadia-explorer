/*
 * Copyright (c) 2018 Richard L. McNeary II
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


import { FeatureCollection } from "geojson";
import * as mbx from "mapbox-gl"; // This is the namespace with type definitions, NOT the static object that is set on window; that object as accessible as the "default" property.
import * as React from "react";


export class ReactMapboxGL extends React.PureComponent<Props, State> {

    constructor(props: Props, context: any) {
        super(props, context);
        this.state = {};
        this.id = `${Date.now()}`;
    }

    public componentDidMount() {
        ReactMapboxGL.log();

        // Let the stack unwind so we can set state in this method.
        setImmediate(() => this.createMap());
    }

    public componentWillUnmount() {
        ReactMapboxGL.log();
        this.onMarkerClickedBound = null;
    }

    public render(): JSX.Element {
        this.updateMap();
        this.updateMarkers();

        // Adding a key prop means the DOM element will never be altered because
        // it will always be considered by React to be represented by the same
        // object. You must also set the ID for Mapbox to be able to attach the
        // map to this element.
        return (
            <div className="map" id={this.id} key={this.id} />
        );
    }


    private fitBoundsCurrentLayerId: string = null;
    private id: string;
    /** The IDs of layers passed as props to this map that are currently displayed. The mbx.Map object doesn't have a method to easily list the layers we really care about. */
    private layerIds = new Set<string>();
    /** Used to determine if the center or zoom of the map have actually changed and onMapChanged should be invoked. */
    private mapDataCurrent: MapData;
    /** A collection of map events that need to be handled asynchronously by invokeMapEvent(). */
    private mapEvents: [(state?: any) => void, any][] = [];
    private mapState: "created" | "creating" | null = null;
    private markers = new Map<string, mbx.Marker>();
    private onMarkerClickedBound = this.onMarkerClicked.bind(this);

    private async createMap() {
        if (this.mapState) {
            return;
        }

        this.mapState = "creating";

        ReactMapboxGL.log("creating a new Map object.");

        // "mbx" is the namespace with type definitions, to get access to the
        // global static object (that would normally be accessed as a property
        // of "window" named "mapboxgl") use the name space's "default" property
        // which is the object we really need when setting the access token.
        (mbx as any).default.accessToken = this.props.accessToken;

        const options = {...this.props.options, ...{container: this.id}};
        const map = new mbx.Map(options);

        // Map events can be invoked during the render phase; the event handlers
        // might update redux state which will cause another render to be
        // requested. Handle these events asynchronously using queueMapEvent()
        // to allow the render to complete.
        map
            .on("moveend", (data: any) => {
                ReactMapboxGL.log("on moveend.");
                const { center, zoom }: {center: mbx.LngLat; zoom: number; } = data.target.transform;
                this.queueMapEvent(s => this.raiseOnMapChanged(s), { center, zoom });
            })
            .on("movestart", (data: any) => {
                ReactMapboxGL.log("on movestart.");
            })
            .on("zoomend", (data: any) => {
                ReactMapboxGL.log("on zoomend.");
                const { center, zoom }: {center: mbx.LngLat; zoom: number; } = data.target.transform;
                this.queueMapEvent(s => this.raiseOnMapChanged(s), { center, zoom });
            })
            .on("zoomstart", () => {
                ReactMapboxGL.log("on zoomstart.");
            });

        await this.waitForMapLoad(map);

        map.resize();

        this.mapState = "created";
        ReactMapboxGL.log("map object ready.");

        this.setState({ map });

        this.invokePropsFunction("onLoaded", this.props);
    }

    private getLayerBounds(source: mbx.GeoJSONSourceRaw): mbx.LngLatBoundsLike {
        const data = source.data as FeatureCollection<mbx.GeoJSONGeometry, { [name: string]: any; }>;
        if (!data.features || data.features.length < 1) {
            return [] as any;
        }

        let coordinates: number[][];
        const bounds: mbx.LngLatBounds[] = data.features
            .map(feature => {
                ({ coordinates } = feature.geometry as any);
                coordinates = Array.isArray(coordinates[0]) ? coordinates : [(coordinates as any)];
                return this.reduceToBounds(coordinates);
            });

        const arrBounds: number[][] = [];
        bounds.forEach(b => b.toArray().forEach(c => arrBounds.push(c)));
        return this.reduceToBounds(arrBounds).toArray();
    }

    private getXYValues(coordinate: number[]): number[] {
        if (coordinate.length < 3) {
            return [...coordinate];
        }

        return coordinate.slice(0, 2);
    }

    private headingToRotateAngle(heading: number): number | void {
        let angle: number = null;
        if (!isNaN(heading)) {
            angle = 180 < heading ? heading - 180 : 180 + heading;
        }

        return angle;
    }

    private invokePropsFunction(name: string, ...args: any[]) {
        try {
            if (!this.props[name]) {
                return;
            }

            this.props[name](...args);
        } catch (err) {
            ReactMapboxGL.log(`error invoking props function '${name}'. %O`, err);
        }
    }

    private static log(message: string = null, ...args: any[]): void {
        const line = new Error().stack.split("\n").find((item, i, arr) => {
            return (0 <= i - 1) && -1 < arr[i - 1].indexOf("Function.log");
        }) || "";
        const start = line.indexOf("at") + 3;
        const end = line.indexOf(" ", start);
        let name = "UNKNOWN";
        if (start <= end) {
            name = line.substring(start, end);
            const dot = name.lastIndexOf(".");
            if (-1 < dot) {
                name = name.substr(dot + 1);
            }
        }
        // tslint:disable-next-line:no-console
        console.log(`ReactMapBoxGL ${name}${message ? " - " : ""}${message ? message : ""}`, ...args);
    }

    private onMarkerClicked(evt: Event) {
        if (!this.props.onMarkerClicked) {
            return;
        }

        const vehicleStr = (evt.currentTarget as HTMLDivElement).getAttribute("data-vehicle");
        if (!vehicleStr) {
            return;
        }

        const vehicle = parseInt(vehicleStr, 10);
        if (isNaN(vehicle)) {
            return;
        }

        let data: MarkerClickedData;
        for (const pair of this.props.sources) {
            const [id, source] = pair;

            for (const feature of (source as any).data.features) {
                const properties = Object.keys(feature.properties);

                for (const property of properties) {
                    if (property !== "vehicle") {
                        continue;
                    }

                    if (vehicle === feature.properties[property]) {
                        data = {
                            marker: `${id}-MARKER-${feature.properties.name}`,
                            properties: { ...feature.properties }
                        };
                        break;
                    }
                }

                if (data) {
                    break;
                }
            }

            if (data) {
                break;
            }
        }

        this.props.onMarkerClicked(data);
    }

    private async queueMapEvent(callback: (state?: any) => void, state?: any) {
        this.mapEvents.push([callback, state]);
        if ((this.mapEvents as any).active) {
            return;
        }

        (this.mapEvents as any).active = true;

        do {
            const [c, s] = this.mapEvents.shift();
            await this.raiseMapEvent(c, s);
        } while (this.mapEvents.length);

        (this.mapEvents as any).active = false;
    }

    private async raiseMapEvent(callback: (state?: any) => void, state?: any) {
        return new Promise<void>(resolve => {
            setImmediate(() => {
                callback(state);
                resolve();
            });
        });
    }

    private raiseOnMapChanged(data: MapData) {
        if (this.mapDataCurrent === data || !this.props.onMapChanged) {
            return;
        }

        const currentCenter = (this.mapDataCurrent ? this.mapDataCurrent.center : {}) as mbx.LngLat;

        if (
            (
                currentCenter !== data.center ||
                currentCenter.lat !== data.center.lat ||
                currentCenter.lng !== data.center.lng
            ) ||
            (
                this.mapDataCurrent.zoom !== data.zoom
            )
        ) {
            this.mapDataCurrent = data;
            ReactMapboxGL.log("raising onMapChanged.");
            this.invokePropsFunction("onMapChanged", data);
        }
    }

    private reduceToBounds(coordinates: number[][]): mbx.LngLatBounds {
        if (coordinates.length < 1) {
            return;
        }

        const initialCoordinate = this.getXYValues(coordinates[0]);
        const initialBounds = new mbx.LngLatBounds(initialCoordinate, initialCoordinate);

        return coordinates.reduce((bounds, coordinate) => {
            return bounds.extend(this.getXYValues(coordinate) as any);
        }, initialBounds);
    }

    private updateMarkers(): void {
        if (this.mapState !== "created") {
            return null;
        }

        if (!this.props.sources || !this.props.sources.size) {
            return null;
        }

        // MapboxGL doesn't keep track of the markers internally (by design to
        // keep MapboxGL "lightweight") so we have to keep track of the markers
        // ourselves. Why? Because when it comes time to remove them we have to
        // use the original instance of the Marker.

        const markersToRemove = new Map<string, mbx.Marker>(this.markers);
        for (const pair of this.props.sources) {
            const [id, source] = pair;

            for (const feature of (source as any).data.features) {
                // We have to create DOM elements here and pass them to the
                // MapboxGL Map which will take ownership of them. We can't use
                // a React component (I tried) because the map will move the
                // elements so that the map itself is their parent element. See
                // this for details if you really want to know what's going on:
                // https://github.com/facebook/react/issues/11538
                const featureId = `${id}-MARKER-${feature.properties.name}`;

                if (markersToRemove.has(featureId)) {
                    markersToRemove.delete(featureId);
                }

                // ReactMapboxGL.log(`vehicle id: ${feature.properties.vehicle}, heading: ${feature.properties.heading}, last stop: ${feature.properties.lastStop}, direction: ${feature.properties.direction}.`);
                ReactMapboxGL.log(`vehicle id: ${feature.properties.vehicle}, trip id: ${feature.properties.tripId}, run id: ${feature.properties.runId}, last stop: ${feature.properties.lastStop}, direction: ${feature.properties.direction}.`);

                let marker = this.markers.has(featureId) ? this.markers.get(featureId) : null;
                let divDirection: HTMLDivElement;
                let divMarker: HTMLDivElement;
                if (marker) {
                    marker.setLngLat(feature.geometry.coordinates);
                    const parent = document.getElementById(featureId);
                    if (parent) {
                        divDirection = parent.getElementsByClassName("map-vehicle-marker-direction")[0] as HTMLDivElement;
                    }

                    if (divDirection) {
                        divMarker = divDirection.getElementsByClassName("map-vehicle-marker")[0] as HTMLDivElement;
                    }
                } else {
                    // This div will be passed to MapboxGL which will set it's
                    // style.transform property to locate the element correctly
                    // on the map. Since we want to rotate the directional
                    // indicator to math the vehicle direction we need this
                    // wrapper element so we can override its child's style
                    // element.
                    const divW = document.createElement("div");
                    divW.id = featureId;
                    divW.setAttribute("data-vehicle", feature.properties.vehicle);
                    divW.addEventListener("click", this.onMarkerClickedBound);

                    // This directional div exists so we can rotate it to match
                    // the vehicle direction.
                    divDirection = document.createElement("div");
                    divDirection.className = feature.properties.communicating ? "map-vehicle-marker-direction" : "map-vehicle-marker-direction-disabled";

                    // This holds the bus icon. Must invert the angle of the
                    // containing dive.
                    divMarker = document.createElement("div");
                    divMarker.className =  feature.properties.communicating ? "map-vehicle-marker" : "map-vehicle-marker-disabled";

                    divDirection.appendChild(divMarker);
                    divW.appendChild(divDirection);

                    marker = (new (mbx as any).Marker(divW) as mbx.Marker)
                        .setLngLat(feature.geometry.coordinates)
                        .addTo(this.state.map);

                    this.markers.set(featureId, marker);
                }

                if (divDirection && divMarker) {
                    // heading: 0 = north (up), 90 = east (right), 180 = south (down), 270 = west (left)
                    // rotate: 0 = south (down), 90 = west (left), 180 = north (up), 270 = east (right)
                    const angle: number | void = this.headingToRotateAngle(feature.properties.heading);
                    divDirection.style.transform = `rotate(${angle || 0}deg)`;
                    divMarker.style.transform = `rotate(${(angle || 0) * -1}deg)`;
                }

            }
        }

        // If any of the current markers in this.markers were not updated here
        // it's time to remove them from our collection and the map.
        if (markersToRemove.size) {
            for (const item of markersToRemove) {
                const [id, marker] = item;

                const div = document.getElementById(id);
                if (div) {
                    div.removeEventListener("click", this.onMarkerClickedBound);
                }

                ReactMapboxGL.log (`removing marker '${id}'.`);
                marker.remove();
                this.markers.delete(id);
            }
        }
    }

    private updateMap() {
        const { map } = this.state;

        if (!map || this.mapState !== "created") {
            ReactMapboxGL.log("no map or map is not loaded.");
            return;
        }

        const layers = this.props.layers || new Map<string, RmbxLayer>();
        ReactMapboxGL.log ("updating layers and sources in the map.");

        let id: string;
        let layer: RmbxLayer;
        for (const kv of layers) {
            ([id, layer] = kv);

            const mLayer = map.getLayer(id);
            if (!mLayer) {
                ReactMapboxGL.log(`adding layer: '${id}'.`);
                map.addLayer(layer.layer);
            } else if (layer.changed) {
                ReactMapboxGL.log(`updating layer: '${id}'.`);
                map.removeLayer(id);
                map.removeSource(id);
                map.addLayer(layer.layer);
            }

            if (layer.layoutProperties) {
                const { layoutProperties: lProps } = layer;
                Object.keys(lProps).forEach(key => map.setLayoutProperty(id, key , lProps[key]));
            }
        }

        const sources = this.props.sources;
        if (sources) {
            for (const kv of sources) {
                const [sourceId, source] = (kv as [string, any]);
                const mSource = map.getSource(sourceId) as mbx.GeoJSONSource;
                if (!mSource) {
                    continue;
                }

                ReactMapboxGL.log(`updating source: '${sourceId}'.`);
                mSource.setData(source.data);
            }
        }


        // Zoom the map to the bounds layer.
        this.updateMapPosition(map, layers);


        // Remove layers that weren't passed as props.
        for (id of this.layerIds) {
            if (layers.has(id)) {
                continue;
            }

            ReactMapboxGL.log(`removing previous props layer: '${id}'.`);
            map.removeLayer(id);
            map.removeSource(id);
            this.layerIds.delete(id);
        }

        // Now update all the layers in the map.
        for (id of layers.keys()) {
            if (!this.layerIds.has(id)) {
                this.layerIds.add(id);
            }
        }
    }

    private updateMapPosition(map: mbx.Map, layers: Map<string, RmbxLayer>) {
        const boundaryLayer = Array.from(layers.values()).find(item => item.bounds);
        const boundaryLayerChanged = boundaryLayer && boundaryLayer.layer.id !== this.fitBoundsCurrentLayerId;
        const resetLayerBounds = (this.fitBoundsCurrentLayerId && boundaryLayerChanged) || boundaryLayer.boundsForce;
        if (resetLayerBounds) {
            const source = boundaryLayer.layer.source as mbx.GeoJSONSourceRaw;
            if (source) {
                const bounds = this.getLayerBounds(source);
                const options: mbx.FitBoundsOptions = {};
                if (this.props.boundsPadding) {
                    options.padding = this.props.boundsPadding;
                }

                this.fitBoundsCurrentLayerId = boundaryLayer.layer.id;
                ReactMapboxGL.log("fitBounds before.");
                map.fitBounds(bounds, options);
                ReactMapboxGL.log("fitBounds after.");
            }
        }

        if (boundaryLayer && boundaryLayer.layer.id) {
            this.fitBoundsCurrentLayerId = boundaryLayer.layer.id;
        }
    }

    private waitForMapLoad(map: mbx.Map): Promise<void> {
        const pl = new Promise(resolve => {
            map.once("load", () => resolve());
        });

        const ps = new Promise(resolve => {
            map.once("styledata", () => resolve());
        });

        return Promise.all([pl, ps]).then(() => { ReactMapboxGL.log("Map loaded."); });
    }
}


export interface MapData {
    center: mbx.LngLatLike;
    zoom: number;
}

interface MarkerClickedData {
    marker: string;
    properties: {
        [ name: string ]: boolean | number | string;
    };
}

export interface RmbxLayer {
    /** Should this layer be taken into account when determining the map bounds? */
    bounds?: true;
    boundsForce?: true;
    /** If true the layer will be updated in the map. */
    changed?: boolean;
    /** The layer object that will be added to the map. */
    layer: mbx.Layer;
    layoutProperties?: {
        /** If true the layer will be made visible in the map. */
        visibility?: "visible" | "none";
    };
}

export interface Props {
    /** The Mapbox API access token. */
    accessToken?: string;
    /** AFter the bounds are determined this padding should be added. */
    boundsPadding?: number;
    /** Layers to add to the map. */
    layers?: Map<string, RmbxLayer>;
    /** It takes some time for the map to load, this function will be invoked when the map is ready to display layers. */
    onLoaded?: (props: Props) => void;
    /** Invoked when the user changes the zoom level. */
    onMapChanged?: (data: MapData) => void;
    onMarkerClicked?: (data: MarkerClickedData) => void;
    /** Options to pass to the Map object when it is created. */
    options?: mbx.MapboxOptions;
    /** These sources will be added to the map or if they already exists their data will be updated. */
    sources?: Map<string, mbx.GeoJSONSource>;
}

interface State {
    map?: mbx.Map;
    zoom?: number;
}
