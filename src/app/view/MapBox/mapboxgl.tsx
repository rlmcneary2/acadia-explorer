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


import * as React from "react";


export class ReactMapBoxGL extends React.Component<Props, State> {

    constructor(props: Props, context: any) {
        super(props, context);
        this.state = {};
        this.id = `${Date.now()}`;
    }

    public render(): JSX.Element {
        ReactMapBoxGL.log();
        this.updateMap();
        return this.renderedElement;
    }

    public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
        const mapReady =
            this.state.map ||
            !this.state.map && nextState.map ?
            true :
            false;

        ReactMapBoxGL.log(`map ready: '${mapReady}'.`);
        return mapReady;
    }

    public componentWillUnmount() {
        ReactMapBoxGL.log();
    }

    public componentDidMount() {
        ReactMapBoxGL.log();

        // Let the stack unwind so we can set state in this method.
        setImmediate(() => this.createMap());
    }


    private id: string;
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

        mapboxgl.accessToken = this.props.accessToken;

        const options = {...this.props.options, ...{container: this.id}};
        const map = new mapboxgl.Map(options);

        await this.waitForMapLoad(map);

        this.mapState = "created";
        ReactMapBoxGL.log("Map object created.");

        this.setState({ map });

        if (this.props.onLoaded) {
            this.props.onLoaded(this.props);
        }
    }

    private getLayerBounds(source): mapboxgl.LngLatBoundsLike {
        const { data: geoJson } = source;
        if (!geoJson.features || geoJson.features.length < 1) {
            return [] as any;
        }

        let coordinates: number[][];
        const bounds: mapboxgl.LngLatBounds[] = geoJson.features
            .map(feature => {
                ({ coordinates } = feature.geometry);
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
        });
        const start = line.indexOf("at") + 3;
        const end = line.indexOf(" ", start);
        let name = line.substring(start, end);
        const dot = name.lastIndexOf(".");
        if (-1 < dot) {
            name = name.substr(dot + 1);
        }
        // tslint:disable-next-line:no-console
        console.log(`ReactMapBoxGL ${name}${message ? " - " : ""}${message ? message : ""}`, ...args);
    }

    private reduceToBounds(coordinates: number[][]): mapboxgl.LngLatBounds {
        if (coordinates.length < 1) {
            return;
        }

        const initialCoordinate = this.getXYValues(coordinates[0]);
        const initialBounds = new mapboxgl.LngLatBounds(initialCoordinate, initialCoordinate);

        return coordinates.reduce((bounds, coordinate) => {
            return bounds.extend(this.getXYValues(coordinate) as any);
        }, initialBounds);
    }

    private updateMap() {
        const { map } = this.state;

        if (!map || !map.isStyleLoaded()) {
            return;
        }

        const { layers } = this.props;
        let id: string;
        let layer: MbxLayer;
        let bounds: mapboxgl.LngLatBoundsLike;
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
                const mSource = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
                if (!mSource) {
                    continue;
                }

                ReactMapBoxGL.log(`updating source: '${sourceId}'.`);
                mSource.setData(source.data);
            }
        }

        // Zoom the map to the bounds layer.
        const boundary = Array.from(layers.values()).find(item => item.bounds);
        if (boundary) {
            const source = map.getSource(boundary.layer.id) as any;
            if (source) {
                bounds = this.getLayerBounds(source.serialize());
                const options: mapboxgl.FitBoundsOptions = {};
                if (this.props.boundsPadding) {
                    options.padding = this.props.boundsPadding;
                }

                map.fitBounds(bounds, options);
            }
        }

        // Remove layers that weren't passed as props.
        for (id of this.layerIds) {
            if (this.props.layers.has(id)) {
                continue;
            }

            ReactMapBoxGL.log(`removing previous props layer: '${id}'.`);
            map.removeLayer(id);
            map.removeSource(id);
            this.layerIds.delete(id);
        }

        // Now update all the layers in the map.
        for (id of this.props.layers.keys()) {
            if (!this.layerIds.has(id)) {
                this.layerIds.add(id);
            }
        }
    }

    private waitForMapLoad(map: mapboxgl.Map): Promise<void> {
        const pl = new Promise(resolve => {
            map.once("load", () => resolve());
        });

        const ps = new Promise(resolve => {
            map.once("styledata", () => resolve());
        });

        return Promise.all([pl, ps]).then(() => { ReactMapBoxGL.log("Map loaded."); });
    }
}


export interface MbxLayer {
    bounds?: true;
    changed?: boolean;
    layer: mapboxgl.Layer;
    layoutProperties?: {
        visibility?: "visible" | "none";
    };
}

export interface Props {
    accessToken?: string;
    boundsPadding?: number;
    layers?: Map<string, MbxLayer>;
    onLoaded?: (props: Props) => void;
    options?: mapboxgl.MapboxOptions;
    sources?: Map<string, mapboxgl.GeoJSONSource>;
}

interface State {
    map?: mapboxgl.Map;
}
