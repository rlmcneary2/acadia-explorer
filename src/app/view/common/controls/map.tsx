

import * as React from "react";
import InteractiveMap from "react-map-gl";


/**
 * The props for the presentational Route component.
 * @interface Props
 */
interface Props {
    latitude: number;
    layerId: string;
    layers?: MapGLLayer[];
    longitude: number;
    zoom: number;
}

interface MapGLLayer {
    id: string;
    layout: {
        visibility?: "none" | "visible";
    };
    type: "fill" | "line" | "symbol" | "circle" | "fill-extrusion" | "raster" | "background";
    source: {
        type: "geojson";
        data: any; // geojson data here
    };
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


export default class Map extends React.Component<Props> {

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

    private mapRef(mapComponent) {
        // We need to get the map component because it has functions that are
        // needed to add layers and such.
        this._map = mapComponent.getMap();
        this.updateMap(this.props);
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
        if (props.layers && 0 < props.layers.length) {
            let layerUpdateCount = 0;
            let layer: MapGLLayer;
            let mapLayer: MapGLLayer;
            for (let i = 0; i < props.layers.length; i++) {
                layer = props.layers[i];
                mapLayer = this._map.getLayer(layer.id);
                if (!mapLayer) {
                    console.log(`Map.updateMap - ${layer.id} visibility: ${layer.layout.visibility}`);
                    this._map.addLayer(layer);
                    layerUpdateCount++;
                }
                else {
                    console.log(`Map.updateMap - ${layer.id} visibility: ${layer.layout.visibility}`);
                    this._map.setLayoutProperty(layer.id, "visibility", layer.layout.visibility);
                    layerUpdateCount++;
                }
            }
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


export { Props, MapGLLayer };
