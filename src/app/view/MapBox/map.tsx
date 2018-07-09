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


import * as mapboxgl from "mapbox-gl";
import * as React from "react";
import InteractiveMap from "react-map-gl";


interface GeoJSON {
    features: any[];
}

export interface MapGLLayer {
    id: string;
    layout: MapGLLayerLineStringLayout | MapGLLayerSymbolLayout | {};
    metadata?: {};
    paint?: MapGLLayerLineStringPaint | MapGLLayerCirclePaint | MapGLLayerSymbolPaint;
    type: "fill" | "line" | "symbol" | "circle" | "fill-extrusion" | "raster" | "background";
    source: {
        type: "geojson";
        data: GeoJSON;
    };
}

export interface MapGLLayerCirclePaint {
    "circle-color": string;
    "circle-radius": number | MapGLCurveTypeStep;
    "circle-stroke-color"?: string;
    "circle-stroke-opacity"?: number;
    "circle-stroke-width"?: number | MapGLCurveTypeStep;
}

export interface MapGLLayerSymbolPaint {
    "text-color"?: string;
    "text-halo-blur"?: number | MapGLCurveTypeStep;
    "text-halo-color"?: string;
    "text-halo-width"?: number | MapGLCurveTypeStep;
}

export interface MapGLLayerLayout {
    visibility?: VisibilityType;
}

export interface MapGLLayerLineStringLayout extends MapGLLayerLayout {
    "line-cap"?: "round";
    "line-join"?: "round";
}

export interface MapGLLayerLineStringPaint {
    "line-color"?: string;
    "line-opacity"?: number;
    "line-width"?: number;
}

export interface MapGLCurveTypeStep {
    base: number;
    stops: number[][];
}

export interface MapGLLayerSymbolLayout extends MapGLLayerLayout {
    "icon-allow-overlap"?: boolean;
    "icon-image"?: string;
    "icon-optional"?: boolean;
    "icon-size"?: number;
    "text-allow-overlap": boolean;
    "text-anchor"?: string | MapGLCurveTypeStep;
    "text-field"?: string;
    "text-offset"?: number | MapGLCurveTypeStep;
    "text-size"?: number | MapGLCurveTypeStep;
}

export const PROPERTY_AFFECTS_ZOOM_TO_FIT = "acx:affectsZoomToFit";

/**
 * The props for the map.
 * @interface Props
 */
export interface Props {
    background?: {
        color: string;
        opacity?: number;
        width: number;
    };
    /** The layer with this ID will be used to determine the bounds of the route that is displayed. */
    boundsLayerId: string;
    mapIsInitialized: () => void;
    isVisible?: boolean;
    latitude: number;
    layers?: MapGLLayer[];
    longitude: number;
    visibleLayersIds?: string[];
    zoom: number;
    zoomToFit?: boolean;
    zoomToFitPadding?: number;
    zoomToLayerId?: string;
}

interface State {
    settings: {
        attributionControl: boolean;
        mapboxApiAccessToken: string;
        mapStyle: string | {};
        onViewportChange: ViewportChanged;
    };
    viewport: {
        height: number;
        latitude: number;
        longitude: number;
        width: number;
        zoom: number;
    };
}

interface ViewportChanged {
    // tslint:disable-next-line:callable-types
    (viewport: any): void;
}

export type VisibilityType = "none" | "visible";


export class Map extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
        this.state = {
            settings: {
                attributionControl: false,
                mapStyle: "mapbox://styles/mapbox/outdoors-v10",
                mapboxApiAccessToken: "pk.eyJ1IjoicmxtY25lYXJ5MiIsImEiOiJjajgyZjJuMDAyajJrMndzNmJqZDFucTIzIn0.BYE_k7mYhhVCdLckWeTg0g",
                onViewportChange: null
            },
            viewport: {
                height: 400,
                latitude: props.latitude,
                longitude: props.longitude,
                width: 400,
                zoom: props.zoom
            }
        };
    }


    public state: State;

    public componentWillMount() {
        this.mapRefBound = this.mapRef.bind(this);
        this.mapWrapperRefBound = this._mapWrapperRef.bind(this);
        this.myViewportChanged = this.viewportChanged.bind(this);

        const nextState: State = { ...this.state };
        nextState.settings.onViewportChange = this.myViewportChanged;
        this.setState(nextState);
    }

    public componentWillReceiveProps(nextProps: Props) {
        // As the KML / geojson information arrives update the map with the
        // available bus route and stop information. Layer visibility is set
        // during render.
        this._updateMapLayers(nextProps);
    }

    public componentWillUnmount() {
        this.mapRefBound = null;
        this.mapWrapperRefBound = null;
        this.myViewportChanged = null;
    }

    public render() {
        const props: any = {
            className: "aex-map-wrapper",
            ref: this.mapWrapperRefBound
        };

        if (!this.props.isVisible) {
            props.style = { visibility: "hidden" };
        }

        this._updateLayerVisibility(this.props);

        return (
            <div {...props}>
                <InteractiveMap {...this.state.viewport} {...this.state.settings} ref={this.mapRefBound} />
            </div>
        );
    }


    private initialized = false;
    private layerIds: string[] = [];
    private map;
    private mapRefBound;
    private mapWrapperRefBound;
    private updateMapTimeout;
    private myViewportChanged: ViewportChanged;

    private viewportChanged(viewport) {
        this.setState({ viewport });
    }

    private addLayer(layer: MapGLLayer): boolean {
        const mapLayer = this.map.getLayer(layer.id);

        let added: boolean;
        if (!mapLayer) {
            this.map.addLayer(layer);
            this.layerIds.push(layer.id);
            added = true;
        }

        return added;
    }

    private getXYValues(coordinate: number[]): number[] {
        if (coordinate.length < 3) {
            return [...coordinate];
        }

        return coordinate.slice(0, 2);
    }

    private getLayerBounds(source: any): mapboxgl.LngLatBounds {
        const { data: geoJson } = source;
        if (!geoJson.features || geoJson.features.length < 1) {
            return [] as any;
        }

        let coordinates: number[][];
        const bounds = geoJson.features
            .map(feature => {
                ({ coordinates } = feature.geometry);
                coordinates = Array.isArray(coordinates[0]) ? coordinates : [(coordinates as any)];
                return this.reduceToBounds(coordinates);
            });

        const arrBounds: number[][] = [];
        bounds.forEach(b => b.toArray().forEach(c => arrBounds.push(c)));
        return this.reduceToBounds(arrBounds);
    }

    private mapRef(mapComponent) {
        // We need to get the map component because it has functions that are
        // needed to add layers and such.
        if (mapComponent) {
            this.map = mapComponent.getMap();
        }
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

    private _updateMapLayers(props: Props) {
        if (!this.map) {
            return;
        }

        // The map doesn't really want to have any changes made until the style
        // has completely loaded so keep polling until the load is complete.
        if (!this.map.isStyleLoaded()) {
            if (this.updateMapTimeout) {
                clearTimeout(this.updateMapTimeout);
            }

            this.updateMapTimeout = setTimeout(() => {
                this._updateMapLayers(props);
            }, 100);
            return;
        }

        // Map style is fully loaded, go ahead and apply layers now.
        if (!this.initialized) {
            this.initialized = true;
            const callback = this.props.mapIsInitialized;
            setTimeout(() => {
                callback();
            });
        }

        // Add any layers that are in layers but not in the map. If the layer is
        // the active layer make it visible.
        if (props.layers && 0 < props.layers.length) {
            for (const layer of props.layers) {
                this.addLayer(layer);
            }
        }
    }

    private _updateLayerVisibility(props: Props) {
        if (!this.initialized) {
            return;
        }

        // Loop over all the layers and set their visibility.
        let layer;
        let isVisible: boolean;
        let bounds: mapboxgl.LngLatBounds;
        for (const id of this.layerIds) {
            isVisible = props.visibleLayersIds.includes(id);

            layer = this.map.getLayer(id);
            if (layer) {
                this.map.setLayoutProperty(id, "visibility", isVisible ? "visible" : "none");
            }

            if (isVisible && props.boundsLayerId === id) {
                const source = this.map.getSource(id);
                if (source) {
                    bounds = this.getLayerBounds(source.serialize());
                }
            }
        }

        // Update the map location and zoom to fit the selected route.
        if (props.zoomToFit && bounds) {
            let args: any = [bounds];
            if (props.zoomToFitPadding) {
                args = [...args, { padding: props.zoomToFitPadding }];
            }

            this.map.fitBounds(...args);
        }
    }

    private _mapWrapperRef(div: HTMLDivElement) {
        // Get the actual width and height in pixels of the div that contains
        // the map and use them to set the map's dimensions.
        const nextProps = { ...this.state };

        if (div) {
            nextProps.viewport = { ...this.state.viewport };
            nextProps.viewport.height = div.clientHeight;
            nextProps.viewport.width = div.clientWidth;
        }

        this.setState(nextProps);
    }
}
