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

 /*
    Credit where it's due; based on the post "A simple pie chart in SVG" by
    David Gilbertson.

    https://hackernoon.com/a-simple-pie-chart-in-svg-dbdd653b6936
 */


import * as React from "react";
import { connect } from "react-redux";


export default connect()((props: Props): JSX.Element => {
    const percent = props.countDown ? 1 - props.percent : props.percent;
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);

    let largeArcFlag = props.percent < 0.5 ? 0 : 1;
    if (props.countDown) {
        largeArcFlag = props.percent < 0.5 ? 1 : 0;
    }

    return (
        <div className="pie-container">
            <svg
                style={{ transform: "rotate(-90deg)" }}
                viewBox={`-1 -1 2 2`}
            >
                <path
                    d={`M 1 0 A 1 1 0 ${largeArcFlag} 1 ${x} ${y} L 0 0`}
                />
            </svg>
        </div>
    );
});


export interface Props {
    /** If true the pie will disappear; false and the pie appears. */
    countDown?: boolean;

    /** How much of the pie to fill; a value between 0.0 and 1.0. */
    percent: number;
}
