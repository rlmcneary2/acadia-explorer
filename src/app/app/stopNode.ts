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


import { Stop, VehicleDirection } from "./interfaces";


export class StopNode implements Stop {

    constructor(name: string, scheduled = false, id = null, direction: VehicleDirection = null) {
        this.name = name;
        this.scheduled = scheduled;
        this.id = id;
        this.direction = direction;
    }

    public direction: VehicleDirection;
    public downstream: StopNode = null;
    public readonly id: number;
    public get isFirst(): boolean {
        return this.upstream === null;
    }
    public get isLast(): boolean {
        return this.downstream === null;
    }
    public readonly name: string;
    public get nodeName(): string {
        return `${this.name}-${this.direction || "?"}`;
    }
    public readonly scheduled: boolean;
    public upstream: StopNode = null;


    /**
     * Set this node's upstream property.
     * @param upstream The StopNode to be set as the value of this node's
     * upstream property.
     * @param [replaceDownstream=false] Set this node as the value of the
     * upstream StopNode's downstream property. Default is false.
     * @returns This StopNode for function chaining.
     */
    public setUpstream(upstream: StopNode = null, replaceDownstream = false): StopNode {
        this.upstream = upstream;

        if (upstream && replaceDownstream) {
            upstream.downstream = this;
        }

        return this;
    }
}
