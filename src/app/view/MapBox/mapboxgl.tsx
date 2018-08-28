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


export class ReactMapBoxGL extends React.PureComponent<Props, State> {

    constructor(props: Props, context: any) {
        super(props, context);
        this.state = {};
        this.id = `${Date.now()}`;
    }

    public componentDidMount() {
        ReactMapBoxGL.log();

        // Let the stack unwind so we can set state in this method.
        setImmediate(() => this.createMap());
    }

    public componentWillUnmount() {
        ReactMapBoxGL.log();
    }

    public render(): JSX.Element {
        ReactMapBoxGL.log();
        this.updateMap();
        return this.renderedElement;
    }


    private id: string;
    /** The IDs of layers passed as props to this map that are currently displayed. The mbx.Map object doesn't have a method to easily list the layers we really care about. */
    private layerIds = new Set<string>();
    private mapState: "created" | "creating" | null = null;
    private get renderedElement(): JSX.Element {
        if (!this.renderedElementValue) {
            ReactMapBoxGL.log("creating a new map <div> element.");
            this.renderedElementValue = (
                <div
                    className="map"
                    id={this.id}
                />
            );
        }

        return this.renderedElementValue;
    }
    private renderedElementValue: JSX.Element;

    private async createMap() {
        if (this.mapState) {
            return;
        }

        this.mapState = "creating";

        ReactMapBoxGL.log("creating a new Map object.");

        // "mbx" is the namespace with type definitions, to get access to the
        // global static object (that would normally be accessed as a property
        // of "window" named "mapboxgl") use the name space's "default" property
        // which is the object we really need when setting the access token.
        (mbx as any).default.accessToken = this.props.accessToken;

        const options = {...this.props.options, ...{container: this.id}};
        const map = new mbx.Map(options);

        await this.waitForMapLoad(map);

        map.resize();

        this.mapState = "created";
        ReactMapBoxGL.log("map object ready.");

        this.setState({ map });

        if (this.props.onLoaded) {
            this.props.onLoaded(this.props);
        }
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
            ReactMapBoxGL.log("no map or map is not loaded.");
            return;
        }

        const { layers } = this.props;
        if (!layers) {
            ReactMapBoxGL.log("no layers in props to add.");
            return;
        }

        ReactMapBoxGL.log ("updating layers and sources in the map.");

        let id: string;
        let layer: RmbxLayer;
        let bounds: mbx.LngLatBoundsLike;
        for (const kv of layers) {
            ([id, layer] = kv);

            const mLayer = map.getLayer(id);
            if (!mLayer) {
                ReactMapBoxGL.log(`adding layer: '${id}'.`);
                map.addLayer(layer.layer);
            } else if (layer.changed) {
                ReactMapBoxGL.log(`updating layer: '${id}'.`);
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

                ReactMapBoxGL.log(`updating source: '${sourceId}'.`);
                mSource.setData(source.data);
            }
        }

        // Zoom the map to the bounds layer.
        const boundaryLayer = Array.from(layers.values()).find(item => item.bounds);
        if (boundaryLayer) {
            const source = boundaryLayer.layer.source as mbx.GeoJSONSourceRaw;
            if (source) {
                bounds = this.getLayerBounds(source);
                const options: mbx.FitBoundsOptions = {};
                if (this.props.boundsPadding) {
                    options.padding = this.props.boundsPadding;
                }

                map.fitBounds(bounds, options);
            }
        }

        // Remove layers that weren't passed as props.
        for (id of this.layerIds) {
            if (layers.has(id)) {
                continue;
            }

            ReactMapBoxGL.log(`removing previous props layer: '${id}'.`);
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

    private waitForMapLoad(map: mbx.Map): Promise<void> {
        const pl = new Promise(resolve => {
            map.once("load", () => resolve());
        });

        const ps = new Promise(resolve => {
            map.once("styledata", () => resolve());
        });

        return Promise.all([pl, ps]).then(() => { ReactMapBoxGL.log("Map loaded."); });
    }
}


export interface RmbxLayer {
    /** Should this layer be taken into account when determining the map bounds? */
    bounds?: true;
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
    /** Options to pass to the Map object when it is created. */
    options?: mbx.MapboxOptions;
    /** These sources will be added to the map or if they already exists their data will be updated. */
    sources?: Map<string, mbx.GeoJSONSource>;
}

interface State {
    map?: mbx.Map;
}
