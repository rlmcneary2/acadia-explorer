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
import { ReactMapboxMarker, Props as MarkerProps } from "./mapboxMarker";


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
    }

    public render(): JSX.Element {
        this.updateMap();

        // Adding a key prop means the DOM element will never be altered because
        // it will always be considered by React to be represented by the same
        // object. You must also set the ID for Mapbox to be able to attach the
        // map to this element.
        return (
            <div className="map" id={this.id} key={this.id}>
                {this.createMarkers()}
            </div>
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

    private createMarkers(): JSX.Element[] {
        if (this.mapState !== "created") {
            return null;
        }

        if (!this.props.sources || !this.props.sources.size) {
            return null;
        }

        const markers: JSX.Element[] = [];
        let count = 0;
        for (const pair of this.props.sources) {
            const [id, source] = pair;

            for (const feature of (source as any).data.features) {
                count++;

                const props: MarkerProps = {
                    className: "map-vehicle-marker",
                    coordinates: feature.geometry.coordinates,
                    direction: 0,
                    key: `${id}-MARKER-${count}`,
                    map: this.state.map
                };

                markers.push((<ReactMapboxMarker {...props} />));
            }
        }

        return markers;
    }

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
            .on("moveend", data => {
                ReactMapboxGL.log("on moveend.");
                const { center, zoom }: {center: mbx.LngLat; zoom: number; } = data.target.transform;
                this.queueMapEvent(s => this.raiseOnMapChanged(s), { center, zoom });
            })
            .on("movestart", data => {
                ReactMapboxGL.log("on movestart.");
            })
            .on("zoomend", data => {
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

    private invokePropsFunction(name: string, ...args) {
        try {
            if (!this.props[name]) {
                return;
            }

            this.props[name](...args);
        } catch (err) {
            ReactMapboxGL.log(`error invoking props function '${name}'. %O`, err);
        }
    }

    private static log(message = null, ...args): void {
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
    /** Options to pass to the Map object when it is created. */
    options?: mbx.MapboxOptions;
    /** These sources will be added to the map or if they already exists their data will be updated. */
    sources?: Map<string, mbx.GeoJSONSource>;
}

interface State {
    map?: mbx.Map;
    zoom?: number;
}
