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


import * as mbx from "mapbox-gl"; // This is the namespace with type definitions, NOT the static object that is set on window; that object 
import * as React from "react";

export class ReactMapboxMarker extends React.PureComponent<Props, {}> {

    public componentWillUnmount() {
        this.refHandlerBoundValue = null;

        if (this.marker) {
            this.marker.remove();
            this.marker = null;
        }
    }

    public render(): JSX.Element {
        const { className = "", key } = this.props;
        const props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> = {
            className,
            key,
            ref: this.refHandlerBound
        };

        return (<div {...props} />);
    }


    private get refHandlerBound(): React.Ref<HTMLDivElement> {
        if (!this.refHandlerBoundValue) {
            this.refHandlerBoundValue = this.refHandler.bind(this);
        }

        return this.refHandlerBoundValue;
    }
    private refHandlerBoundValue: React.Ref<HTMLDivElement>;
    private marker: mbx.Marker;

    private refHandler(div: HTMLDivElement) {
        this.marker = (new (mbx as any).Marker(div) as mbx.Marker)
            .setLngLat(this.props.coordinates)
            .addTo(this.props.map);
    }
}


export interface Props {
    className?: string;
    coordinates: mbx.LngLatLike;
    direction: number;
    key: string;
    map: mbx.Map;
}
