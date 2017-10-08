

import * as React from "react";
import InteractiveMap from "react-map-gl";
import * as mapboxgl from "mapbox-gl";


const PROPERTY_AFFECTS_ZOOM_TO_FIT = "acx:affectsZoomToFit";


namespace MapBoxReact {

    export interface GeoJSON {
        features: any[];
    }

    export interface MapGLLayer {
        id: string;
        layout: {
            "line-cap"?: "round";
            "line-join"?: "round";
            visibility?: VisibilityType;
        };
        metadata?: {};
        paint: {
            "line-color": string;
            "line-opacity": number;
            "line-width": number;
        };
        type: "fill" | "line" | "symbol" | "circle" | "fill-extrusion" | "raster" | "background";
        source: {
            type: "geojson";
            data: GeoJSON;
        };
    }

    /**
     * The props for the presentational Route component.
     * @interface Props
     */
    export interface Props {
        background?: {
            color: string;
            opacity?: number;
            width: number;
        };
        latitude: number;
        layerId: string;
        layers?: MapGLLayer[];
        longitude: number;
        zoom: number;
        zoomToFit?: boolean;
        zoomToFitPadding?: number;
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
        (viewport: any): void;
    }

    export type VisibilityType = "none" | "visible";


    export class Map extends React.Component<Props> {

        constructor(props: Props) {
            super(props);
            this.state = {
                settings: {
                    attributionControl: false,
                    mapboxApiAccessToken: "pk.eyJ1IjoicmxtY25lYXJ5MiIsImEiOiJjajgyZjJuMDAyajJrMndzNmJqZDFucTIzIn0.BYE_k7mYhhVCdLckWeTg0g",
                    onViewportChange: null,
                    mapStyle: "mapbox://styles/mapbox/outdoors-v10"
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

        public componentWillMount() {
            this._mapRef = this.mapRef.bind(this);
            this._mapWrapperRef = this.mapWrapperRef.bind(this);
            this._viewportChanged = this.viewportChanged.bind(this);

            const nextState: State = Object.assign({}, this.state);
            nextState.settings.onViewportChange = this._viewportChanged;
            this.setState(nextState);
        }

        public componentWillReceiveProps(nextProps: Props) {
            // As the KML / geojson information arrives update the map with the
            // available bus routes. Only the selected route will be visible.
            if (
                nextProps.layerId !== this.props.layerId ||
                nextProps.layers.length !== this.props.layers.length ||
                !this.props.layers.every(item => 0 <= nextProps.layers.findIndex(nItem => nItem.id === item.id))
            ) {
                this.updateMap(nextProps);
            }
        }

        public componentWillUnmount() {
            this._mapRef = null;
            this._mapWrapperRef = null;
            this._viewportChanged = null;
        }

        public render() {
            return (
                <div className="aex-map-wrapper" ref={this._mapWrapperRef}>
                    <InteractiveMap {...this.state.viewport} {...this.state.settings} ref={this._mapRef} />
                </div>
            );
        }

        public state: State;


        private _viewportChanged: ViewportChanged;

        private viewportChanged(viewport) {
            this.setState({ viewport });
        }

        private _map;

        private _mapRef;

        private _updateMapTimeout;

        private addLayer(layer: MapGLLayer): boolean {
            const mapLayer = this._map.getLayer(layer.id);

            let added: boolean;
            if (!mapLayer) {
                this._map.addLayer(layer);
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

        private getLayerBounds(layer: MapGLLayer): mapboxgl.LngLatBounds {
            const { data: geoJson } = layer.source;
            if (!geoJson.features || geoJson.features.length < 1) {
                return [];
            }

            let coordinates: number[][];
            const bounds = geoJson.features
                .map(feature => {
                    ({ coordinates } = feature.geometry);
                    return this.reduceToBounds(coordinates);
                });

            const arrBounds: number[][] = [];
            bounds.forEach(b => b.toArray().forEach(c => arrBounds.push(c)));
            return this.reduceToBounds(arrBounds);
        }

        private mapRef(mapComponent) {
            // We need to get the map component because it has functions that are
            // needed to add layers and such.
            this._map = mapComponent.getMap();
            this.updateMap(this.props);
        }

        private reduceToBounds(coordinates: number[][]): mapboxgl.LngLatBounds {
            if (coordinates.length < 1) {
                return;
            }

            const initialCoordinate = this.getXYValues(coordinates[0]);
            const initialBounds = new mapboxgl.LngLatBounds(initialCoordinate, initialCoordinate);

            return coordinates.reduce((bounds, coordinate) => {
                return bounds.extend(this.getXYValues(coordinate));
            }, initialBounds);
        }

        private updateMap(props: Props) {
            if (!this._map) {
                return;
            }

            // The map doesn't really want to have any changes made until the style
            // has completely loaded so keep polling until the load is complete.
            if (!this._map.isStyleLoaded()) {
                if (this._updateMapTimeout) {
                    clearTimeout(this._updateMapTimeout);
                }

                this._updateMapTimeout = setTimeout(() => {
                    this.updateMap(props);
                }, 100);
                return;
            }

            // Map style is fully loaded, go ahead and apply layers now.

            // Add any layers that are in layers but not in the map. If the layer is
            // the active layer make it visible.
            let bounds: mapboxgl.LngLatBounds;
            if (props.layers && 0 < props.layers.length) {
                let layer: MapGLLayer;
                for (let i = 0; i < props.layers.length; i++) {
                    layer = props.layers[i];

                    // Will be used to move and zoom the map to fit in the
                    // viewport.
                    if (layer.id === props.layerId || layer.metadata[PROPERTY_AFFECTS_ZOOM_TO_FIT]) {
                        bounds = this.getLayerBounds(layer);
                    }

                    if (this.addLayer(layer)) {
                        // The line layer was added. Now add a background layer
                        // to highlight the line.
                        if (props.background) {
                            const backgroundLayer = Object.assign({}, layer);
                            backgroundLayer.id = `background-${layer.id}`;
                            backgroundLayer.paint = Object.assign({}, layer.paint);
                            backgroundLayer.paint["line-color"] = props.background.color;
                            backgroundLayer.paint["line-opacity"] = props.background.hasOwnProperty("opacity") ? props.background.opacity : 1;
                            backgroundLayer.paint["line-width"] = props.background.width;
                            this._map.addLayer(backgroundLayer);
                            this._map.moveLayer(backgroundLayer.id, layer.id);
                        }
                    } else {
                        // The line already exists. Update the line and
                        // background visibility.
                        this._map.setLayoutProperty(layer.id, "visibility", layer.layout.visibility);
                        this._map.setLayoutProperty(`background-${layer.id}`, "visibility", layer.layout.visibility);
                    }
                }

                // Update the map location and zoom to fit the selected route.
                if (props.zoomToFit) {
                    if (bounds) {
                        let args = [bounds];
                        if (props.zoomToFitPadding) {
                            args = [...args, { padding: props.zoomToFitPadding }];
                        }

                        this._map.fitBounds(...args);
                    }
                }
            } else {
                this._map.flyTo({ center: [props.latitude, props.longitude], zoom: props.zoom });
            }
        }

        private _mapWrapperRef;

        private mapWrapperRef(div: HTMLDivElement) {
            // Get the actual width and height in pixels of the div that contains
            // the map and use them to set the map's dimensions.
            const nextProps = Object.assign({}, this.state);
            nextProps.viewport = Object.assign({}, this.state.viewport);
            nextProps.viewport.height = div.clientHeight;
            nextProps.viewport.width = div.clientWidth;
            this.setState(nextProps);
        }
    }


    export function createMapGLLayer(id: string, geojson: GeoJSON, visibility: VisibilityType = "visible", affectsZoomToFit = true): MapGLLayer {
        // Get the color from the first feature and add that to the MapGLLayer.
        let paint: any;
        const features: any[] = geojson && geojson.features ? geojson.features : [];
        if (0 < features.length) {
            const feature = features[0];
            if (feature.properties) {
                paint = {};
                paint["line-color"] = feature.properties.stroke || "#000";
                paint["line-opacity"] = feature.properties["stroke-opcaity"] || 1;
                paint["line-width"] = feature.properties["stroke-width"] || "20";
            }
        }

        const layer: MapGLLayer = {
            id,
            layout: {
                "line-cap": "round",
                "line-join": "round",
                visibility
            },
            metadata: {
                [PROPERTY_AFFECTS_ZOOM_TO_FIT]: affectsZoomToFit
            },
            paint,
            type: "line",
            source: {
                data: geojson,
                type: "geojson"
            }
        };

        return layer;
    }

}


export default MapBoxReact;
