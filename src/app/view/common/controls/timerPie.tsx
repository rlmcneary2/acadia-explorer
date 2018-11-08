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


import Pie from "@controls/pie";
import * as React from "react";


export class TimerPie extends React.PureComponent<Props, State> {

    constructor(props: Props, context: any) {
        super(props, context);
        this.state = {};
    }

    public componentDidMount() {
        this.intervalHandle = setInterval(() => {
            this.setState({ percent: this.calculatePercent() });
        }, this.props.refreshMs) as any;
    }

    public componentDidUpdate(prevProps: Props) {
        if (prevProps.expiresMs !== this.props.expiresMs) {
            this.setState({ percent: this.props.countDown ? 1.0 : 0.0 });
        }
    }

    public componentWillUnmount() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
    }

    public render(): JSX.Element {
        const percent = this.state.percent || this.calculatePercent();
        return (<Pie countDown={this.props.countDown} percent={percent} />);
    }

    private intervalHandle: number;

    private calculatePercent(): number {
        const now = Date.now();

        const startTime = this.props.expiresMs - this.props.spanMs;
        const elapsed = now - startTime;
        const percent = elapsed / this.props.spanMs;

        return percent;
    }
}


export interface Props {
    /** If true the pie will disappear; false and the pie appears. */
    countDown?: boolean;
    /** The time when the pie should reach 100% (or 0%). */
    expiresMs: number;
    /** The total time over which the pie will go from 0% to 100% (or vice-versa). */
    spanMs: number;
    /** How often the pie should be updated. */
    refreshMs: number;
}

interface State {
    percent?: number;
}
