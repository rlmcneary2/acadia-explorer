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
        this.id = `${Date.now()}`;
    }

    public render(): JSX.Element {
        return this.renderedElement;
    }

    public shouldComponentUpdate(nextProps: Props): boolean {
        // This is where the Map should be updated if the layers or sources have changed.

        const { layers = [] } = nextProps;

        const changedSources: GeoSource[] = [];
        const changedLayers = [];
        for (const item of layers) {
            ReactMapBoxGL.log(`Layer: ${item.id}`);
            // Strip the source from the layer.
            const { source, ...layer } = item;
            const geoSource = source as mapboxgl.GeoJSONSource;

            const layerJson = JSON.stringify(layer);
            if (!this.layers.has(item.id)) {
                this.layers.set(item.id, layerJson);
                ReactMapBoxGL.log(`Adding layer: ${item.id}`);
                changedLayers.push(layer);
            } else {
                if (this.layers.get(item.id) !== layerJson) {
                    ReactMapBoxGL.log(`Updating layer: ${item.id}`);
                    this.layers.set(item.id, layerJson);
                    changedLayers.push(layer);
                }
            }

            // Expect sources to change more often than layers.
            const sourceJson = source ? JSON.stringify(source) : "";
            if (!this.sources.has(item.id)) {
                this.sources.set(item.id, sourceJson);
                ReactMapBoxGL.log(`Adding source: ${item.id}`);
                changedSources.push({ ...geoSource, id: item.id } as any);
            } else {
                if (this.sources.get(item.id) !== sourceJson) {
                    this.sources.set(item.id, sourceJson);
                    ReactMapBoxGL.log(`Updating source: ${item.id}`);
                    changedSources.push({ ...geoSource, id: item.id } as any);
                }
            }
        }

        this.updateMap(changedLayers, changedSources);

        return false;
    }


    private id: string;
    private layers = new Map<string, string>();
    private map: mapboxgl.Map;
    // private ref: HTMLDivElement;
    private get renderedElement(): JSX.Element {
        if (!this.renderedElementValue) {
            ReactMapBoxGL.log("creating a new map <div> element.");
            this.renderedElementValue = (
                <div
                    className="map"
                    id={this.id}
                    ref={ref => this.setRef(ref)}
                />
            );
        }

        return this.renderedElementValue;
    }
    private renderedElementValue: JSX.Element;
    private sources = new Map<string, string>();


    private async createMap() {
        mapboxgl.accessToken = this.props.accessToken;

        const options = {...this.props.options, ...{container: this.id}};
        ReactMapBoxGL.log("creating a new Map object.");
        this.map = new mapboxgl.Map(options);

        await this.waitForMapLoad(this.map);

        if (this.props.layers) {
            for (const layer of this.props.layers) {
                this.map.addLayer(layer);
            }
        }

        if (this.props.onLoaded) {
            this.props.onLoaded(this.props);
        }
    }

    private static log(message, ...args): void {
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
        console.log(`ReactMapBoxGL ${name} - ${message}`, ...args);
    }

    private setRef(ref: HTMLDivElement) {
        if (!ref) {
            return;
        }

        // this.ref = ref;

        this.createMap();
    }

    private updateMap(layers: mapboxgl.Layer[], sources: GeoSource[]) {
        if (!this.map || !this.map.isStyleLoaded()) {
            return;
        }

        for (const layer of layers) {
            const l = this.map.getLayer(layer.id);
            if (l) {
                this.map.removeLayer(layer.id);
            }

            this.map.addLayer(layer);
        }

        for (const source of sources) {
            const s = this.map.getSource(source.id);
            if (s) {
                this.map.removeSource(source.id);
            }

            const { id, ...src } = source;
            this.map.addSource(id, src);
        }
    }

    private waitForMapLoad(map: mapboxgl.Map): Promise<void> {
        const pl = new Promise(resolve => {
            this.map.once("load", () => resolve());
        });

        const ps = new Promise(resolve => {
            this.map.once("styledata", () => resolve());
        });

        return Promise.all([pl, ps]).then(() => { /* nada */ });
    }
}


interface GeoSource extends mapboxgl.GeoJSONSource {
    id: string;
}

export interface Props {
    accessToken?: string;
    layers?: mapboxgl.Layer[];
    onLoaded?: (props: Props) => void;
    options?: mapboxgl.MapboxOptions;
}

interface State {
}
