/*
 * Copyright (c) 2019 Richard L. McNeary II
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


import { Landmark, Route, RoutePageArrayType, RoutePageType } from "@reducer/app";
import * as React from "react";
import { FormattedMessage } from "react-intl";


export default (props: Props): JSX.Element => {
    const { route } = props;
    const info = route.page ? renderPage(route) : renderRoute(route);

    return (
        <div className="route-info">
            <div className="route-info-container">
                <h1>{route.name}</h1>
                {info}
            </div>
        </div>
    );
};

function createPageElement(e: RoutePageType | RoutePageArrayType, i: number, indexPrefix = ""): JSX.Element {
    const key = Object.keys(e)[0];

    const keyPropBase = `${indexPrefix}${i}-`;
    const keyProp = `${keyPropBase}${key}`;
    let result: JSX.Element;
    switch (key) {
        case "li": {
            const v = e[key];
            result = typeof v === "string" ? (<FormattedMessage id={v} key={keyProp} tagName={key} />) : createPageElement(v, i, keyPropBase);
            break;
        }

        case "ul": {
            const arr = e[key] as (RoutePageType | RoutePageArrayType)[];
            result = (<ul key={keyProp}>{arr.map((x, idx) => createPageElement(x, idx, keyPropBase))}</ul>);
            break;
        }

        default: {
            result = (<FormattedMessage id={e[key]} key={keyProp} tagName={key} />);
            break;
        }
    }

    return result;
}

function landmarkDescription(landmark: Landmark): JSX.Element {
    return landmark.descriptionShort ? (<FormattedMessage id={landmark.descriptionShort} />) : null;
}

function renderLandmarks(route: Route): JSX.Element {
    if (!route.landmarks || !route.landmarks.length) {
        return null;
    }

    const getDescription = (landmark: Landmark): JSX.Element => {
        const l = landmarkDescription(landmark);
        if (!l) {
            return null;
        }

        return (<span> ‑ {l}</span>);
    };

    return (
        <React.Fragment>
            <FormattedMessage id="LBL_ALONG_ROUTE" tagName="h2" />
            <ul>{route.landmarks.map((x, i) => (<li key={`lk-${i}`}>{x.name}{getDescription(x)}</li>))}</ul>
        </React.Fragment>
    );
}

function renderPage(route: Route): JSX.Element {
    return (
        <React.Fragment>
            {route.page.map<JSX.Element>((x, i) => createPageElement(x, i))}
            {renderScheduledStops(route)}
            {renderLandmarks(route)}
        </React.Fragment>
    );
}

function renderRoute(route: Route): JSX.Element {
    return (
        <div>{route.description}</div>
    );
}

function renderScheduledStops(route: Route): JSX.Element {
    return (
        <React.Fragment>
            <FormattedMessage id="LBL_SCHEDULED_STOPS" tagName="h2" />
            <ul>{route.scheduledStops[0].stops.map((x, i) => (<li key={`st-${i}`}>{x.name}</li>))}</ul>
        </React.Fragment>
    );
}


interface Props {
    route: Route;
}


export { Props };
