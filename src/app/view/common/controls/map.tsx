

import * as React from "react";
import InteractiveMap from "react-map-gl";


/**
 * The props for the presentational Route component.
 * @interface Props
 */
interface Props {
    latitude: number;
    longitude: number;
    zoom: number;
}

interface State {
    settings: {
        attributionControl: boolean;
        mapboxApiAccessToken: string;
        mapStyle: string;
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
                mapStyle: "mapbox://styles/mapbox/outdoors-v10",
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
        this._mapWrapperRef = this.mapWrapperRef.bind(this);
        this._viewportChanged = this.viewportChanged.bind(this);

        const nextState: State = Object.assign({}, this.state);
        nextState.settings.onViewportChange = this._viewportChanged;
        this.setState(nextState);
    }

    public componentWillUnmount() {
        this._mapWrapperRef = null;
        this._viewportChanged = null;
    }

    public render() {
        console.log("render: %O", this.state.viewport);
        return (
            <div className="aex-map-wrapper" ref={this._mapWrapperRef}>
                <InteractiveMap {...this.state.viewport} {...this.state.settings} />
            </div>
        );
    }

    public state: State;


    private _viewportChanged: ViewportChanged;

    private viewportChanged(viewport) {
        console.log("viewportChanged: %O", viewport);
        this.setState({ viewport }, () => {
            console.log("setState: %O", this.state.viewport);
        });
    }

    private _mapWrapperRef;

    private mapWrapperRef(div: HTMLDivElement) {
        const nextProps = Object.assign({}, this.state);
        nextProps.viewport.height = div.clientHeight;
        nextProps.viewport.width = div.clientWidth;
        this.setState(nextProps);
    }
}


export { Props };
