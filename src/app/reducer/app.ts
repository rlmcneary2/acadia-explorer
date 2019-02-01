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


import { Action } from "redux";
import { actionApp } from "../action/app";
import { DataAction /*, DataActionId*/ } from "../action/interfaces";
import { StopSchedule /*VehicleDirection*/ } from "../app/interfaces";


export default (state: State = {}, action: Action): State => {
    let nextState: State;

    switch (action.type) {

        // case actionApp.types.updateLastStop: {
        //     const a = action as DataActionId<string, StateStopData>;
        //     const { data, id } = a;
        //     nextState = { ...state };
        //     nextState.routes[id].lastStopData = [...nextState.routes[id].lastStopData, data];
        //     break;
        // }

        case actionApp.types.updateAppData: {
            const a = action as DataAction<{ landmarks: Landmark[]; routes: Route[] }>;
            const { data } = a;
            const { landmarks, routes } = data;
            nextState = {...state, landmarks, routes};
            break;
        }

        // case actionApp.types.updateStops: {
        //     const { data, id } = action as DataActionId<string, StateStop[]>;
        //     nextState = { ...state };
        //     nextState.routes[id].stops = [...state.routes[id].stops || [], ...data];
        //     break;
        // }

    }

    return nextState || state;
};


type LandmarkFeatureType = { [key in "climb" | "hike" | "restroom"]: string };

interface Landmark {
    description?: string;
    descriptionShort?: string;
    features?: LandmarkFeatureType[];
    id?: number;
    landmarkType: string;
    name: string;
    location: { elevation?: number; latitude: number; longitude: number; };
}

type RoutePageType = { [key in "h1" | "li" | "p" | "tip"]: string };

type RoutePageArrayType = { [key in "li" | "ul"]: RoutePageType | RoutePageArrayType };

interface Route { // Some of these interface properties are part of app.json.
    description: string;
    id: number;
    landmarks: Landmark[];
    name: string;
    page: (RoutePageType | RoutePageArrayType)[];
    scheduledStops: ScheduledStop[];
}

interface State {
    landmarks?: Landmark[];
    routes?: Route[];
}

// interface Routes {
//     [key: string]: Route; // The route ID as a string (e.g. "3").
// }

interface ScheduledStop extends StopSchedule {
    stops: { description: string; id: number; name: string; }[];
}

export { Landmark, Route, RoutePageArrayType, RoutePageType, ScheduledStop, State/*, Routes*/ };
