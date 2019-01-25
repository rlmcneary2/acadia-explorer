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


import util from "@util/dateTime";
import logg from "@util/logg";
import { Queue, Task } from "asqueue";
import { Store } from "redux";
import { ThunkDispatch } from "redux-thunk";
import { appData, StopChain, StopEntry } from "../app/route";
import { StopNode } from "../app/stopNode";
import { RouteStopsStop, RouteVehicles } from "../reducer/api";
import { Route } from "../reducer/app";
import { State } from "../reducer/interfaces";


const queue = new Queue();


export default async (store: Store<State>) => {
    const task: Task<void> = {
        callback: async t => {
            // logg.debug(() => "listener/route task - start.");
            const { state }: { state: State } = (t as any);
            const { routes = {} } = state.app;
            for (const strRouteId of Object.keys(routes)) {
                const routeId = parseInt(strRouteId, 10);
                const route = routes[strRouteId];

                if (!createDefaultRouteChain(routeId, state)) {
                    continue;
                }

                updateRouteLastStopData(routeId, route, state, store.dispatch);
            }
            // logg.debug(() => "listener/route task - end.");
        }
    };

    (task as any).state = { ...store.getState() };
    await queue.add(task);
};


function createDefaultRouteChain(id: number, state: State): boolean {
    if (!appData) {
        return false;
    }

    appData.routeStopChains = appData.routeStopChains || {};
    const { routeStopChains } = appData;

    let stopChains = routeStopChains[id];
    if (!stopChains) {
        stopChains = [];
        routeStopChains[id] = stopChains;
    }

    if (stopChains.length && stopChains.filter(item => item.nodes.length < 1).length < 1) {
        return true;
    }

    const { routes } = state.app;
    if (!routes) {
        return false;
    }

    const { routeStops } = state.api;
    const routeStop = routeStops.find(item => item.id === id);
    if (!routeStop) {
        return false;
    }

    const route = routes.find(x => x.id === id);
    for (const scheduledStop of route.scheduledStops) {
        const { dates, hours, stops } = scheduledStop;

        const stopChain: StopChain = { dates, hours, nodes: [] };
        stopChains.push(stopChain);

        for (let i = 0; i < stops.length; i++) {
            const stop = routeStop.stops.find(item => item.StopId ===  stops[i].id);
            const stopNode = new StopNode(stop.Name, true, stop.StopId);

            const previousStop = 0 < i ? stopChain.nodes[i - 1] : null;

            stopNode.setUpstream(previousStop, true);

            stopChain.nodes.push(stopNode);
        }
    }

    // If there are duplicate stops then the early ones are outbound and the
    // later ones are inbound. A route never goes to a stop more than twice
    // right? We can set some of the direction values here based on that.
    for (const stopChain of stopChains) {
        for (const node of stopChain.nodes) {
            const nodes = stopChain.nodes.filter(item => item.name === node.name);
            if (nodes.length === 1) {
                continue;
            }

            const nodeIndex = stopChain.nodes.findIndex(item => item === node);
            if (nodeIndex === 0) {
                node.direction = "outbound";
                continue;
            } else if (nodeIndex === stopChain.nodes.length - 1) {
                node.direction = "inbound";
                continue;
            }

            let min: number = nodeIndex;
            let max: number = nodeIndex;
            for (const match of nodes) {
                const matchIndex = stopChain.nodes.findIndex(item => item === match);
                min = matchIndex < min ? matchIndex : min;
                max = max < matchIndex ? matchIndex : max;
            }

            if (min === nodeIndex) {
                node.direction = "outbound";
            } else if (max === nodeIndex) {
                node.direction = "inbound";
            }
        }
    }

    return true;
}

function getRouteVehicles(routeId: number, vehicles: RouteVehicles[]): any[] {
    const routeVehicles = vehicles.filter(item => item.id === routeId);
    return routeVehicles.length ? routeVehicles[0].vehicles : [];
}

function getRouteStopByName(routeId: number, name: string, state: State): RouteStopsStop {
    const { routeStops } = state.api;
    const route = routeStops.find(item => item.id === routeId);
    if (!route) {
        return;
    }

    const { stops } = route;
    for (const stop of stops) {
        if (stop.Name === name) {
            return stop;
        }
    }
}

function isScheduledStopId(route: Route, stopId: number): boolean {
    // If the stop ID is in any of the scheduled stops for the route it will be
    // considered a scheduled stop, regardless of the CURRENT time or date.
    for (const scheduledStops of route.scheduledStops) {
        for (const stop of scheduledStops.stops) {
            if (stop.id === stopId) {
                return true;
            }
        }
    }

    // Do the current scheduled stops apply to this stop?
    return false;
}

function updateRouteLastStopData(routeId: number, route: Route, state: State, dispatch: ThunkDispatch<State, null, any>) {
    const { routeStops, routeVehicles } = state.api;

    // Must have the routeStops for this routeId and its stop information before
    // we can work with stops. 
    if (!routeStops || !routeStops.length || !routeStops.find(item => item.id === routeId)) {
        return;
    }

    // Are there vehicles for this route? If not exit.
    const vehicles = getRouteVehicles(routeId, routeVehicles);
    if (!vehicles || !vehicles.length) {
        return;
    }

    logg.debug(() => `listener/route updateRouteLastStopData - routeId: ${routeId}`);

    const stopChain = util.getCurrentStops<StopChain>(appData.routeStopChains[routeId], true);
    logg.debug(() => `listener/route updateRouteLastStopData - chain:\r\n${JSON.stringify(stopChain.nodes.map(item => item.stringifiable()))}`);

    let changed = false;
    for (const vehicle of vehicles) {
        // Loop over all of the vehicles to try and build a list of all the
        // stops on a route - not just the scheduled stops - in order.
        const { DirectionLong: directionLong, LastStop: stopName, VehicleId: vehicleId, RunId: runId, TripId: tripId } = vehicle;
        const direction = (directionLong as string).toLowerCase() === "inbound" ? "inbound" : "outbound";

        logg.debug(() => [
            "listener/route updateRouteLastStopData - vehicle: %O",
            JSON.stringify({ vehicleId, stopName, tripId, runId, direction })
        ]);

        const routeStop = getRouteStopByName(routeId, stopName, state);

        logg.debug(() => `listener/route updateRouteLastStopData - stop name: ${stopName}`);

        // If this stop already exists in appData it doesn't need to be added.
        if (appData.stops.some(stop => {
            return stop.name === stopName &&
                stop.direction === direction &&
                stop.runId === runId &&
                stop.tripId === tripId &&
                stop.vehicleId === vehicleId;
        })) {
            continue;
        }

        changed = true;

        const stopEntry: StopEntry = {
            created: Date.now(),
            direction,
            id: routeStop ? routeStop.StopId : null,
            name: stopName,
            routeId,
            runId,
            scheduled: routeStop ? isScheduledStopId(route, routeStop.StopId) : false,
            tripId,
            vehicleId
        };

        logg.debug(() => ["listener/route updateRouteLastStopData - stopEntry: %O", stopEntry]);

        appData.stops = [...appData.stops, stopEntry];

        // The stop direction is only available with the stop information
        // provided by the vehicle. Update the stop nodes here.
        const nodes = stopChain.nodes.filter(item => item.name === stopName);
        if (nodes.length) {
            const index = nodes.length === 1 || direction === "outbound" ? 0 : nodes.length - 1;
            const n = nodes[index];
            n.direction = n.direction || direction;
        }
    }

    if (!changed) {
        return;
    }

    logg.debug(() => ["listener/route updateRouteLastStopData - appData stops: %O", appData.stops]);

    const vehicleIds = appData.stops
        .reduce<number[]>((acc: number[], cur) => acc.some(item => item === cur.vehicleId) ? acc : [...acc, cur.vehicleId], []);

    for (const vehicleId of vehicleIds) {
        // TODO: if there is more than one trip ID for a vehicle process all the
        // lap entries for the trip ID prior to the previous one. 
        const tripIds = appData.stops
            .filter(item => item.vehicleId === vehicleId)
            .sort((a, b) => a.created - b.created)
            .reduce<number[]>((acc: number[], cur) => acc.some(item => item === cur.tripId) ? acc : [...acc, cur.tripId], []);

        // TOOD: if a vehicle is no longer active process all of its vehicle lap entries.
        if (1 < tripIds.length || !vehicles.some(item => item.VehicleId === vehicleId)) {
            // Process here or in the redcer?
            updateRouteStopsChain(routeId, vehicleId, tripIds.slice(0, tripIds.length - 1));
            // logg.debug(() => [
            //     "listener/route updateRouteLastStopData - TODO process laps: %O",
            //     appData.stops.filter(item => item.vehicleId === vehicleId && item.tripId !== tripIds[tripIds.length - 1])
            // ]);
        }
    }
}

function updateRouteStopsChain(routeId: number, vehicleId: number, tripIds: number[]) {
    // Get entries lists from appData.stops.
    const { stops } = appData;
    const stopEntries = stops.filter(item => item.vehicleId === vehicleId && tripIds.some(id => id === item.tripId));

    // Remove found lists from appData.stops.
    appData.stops = stops.filter(item => !stopEntries.some(se => se === item));

    // Update the chains.
    const chains = appData.routeStopChains[routeId];
    for (const tripId of tripIds) {
        const orderedStopEntries = stopEntries.filter(item => item.tripId === tripId).sort((a, b) => a.created - b.created);

        // If all the entries in a list are for scheduled stops ignore that list.
        if (!orderedStopEntries.some(item => !item.scheduled)) {
            continue;
        }

        // Iterate over the entries (stops) in a list and chain them to existing stops.
        let previous: StopEntry;
        let currentEntry: StopEntry;
        let downstream: StopNode;
        let upstream: StopNode;
        let currentNode: StopNode;
        let chain: StopChain;
        let duplicates: StopNode[];
        let dupe0: StopNode;
        let dupe1: StopNode;
        let index: number;
        let keep: StopNode;
        let remove: StopNode;
        for (let i = 1; i < orderedStopEntries.length; i++) {
            previous = orderedStopEntries[i - 1];
            currentEntry = orderedStopEntries[i];

            if (previous.scheduled && currentEntry.scheduled) {
                continue;
            }

            // TODO: get the correct chain based on the time.
            ([chain] = chains);

            // TODO: if the current node is a scheduled node and the previous
            // node is not we now know something about the previous node: that
            // the current node is the farthest downstream the previous node
            // (stop) can be. Update the previous node's downstream connection
            // to be the downstream node with the shortest upstream count.
            if (currentEntry.scheduled) {
                const previousNodeName = StopNode.createNodeName(previous.name, previous.direction);
                const previousNode = chain.nodes.find(item => item.nodeName === previousNodeName);
                if (!previousNode) {
                    continue;
                }

                const currentNodeName = StopNode.createNodeName(currentEntry.name, currentEntry.direction);
                currentNode = chain.nodes.find(item => item.nodeName === currentNodeName);
                if (!currentNode) {
                    continue;
                }

                ({ downstream } = previousNode);
                if (!downstream) {
                    previousNode.downstream = currentNode;
                    continue;
                }

                if (currentNode.getUpstreamCount() < downstream.getUpstreamCount()) {
                    previousNode.setDownstream(currentNode);
                }
            } else {
                // Find the previous entry in the array. If it doesn't exist create
                // it and set its upstream node to the head of the chain. If it does
                // exist create a node for current and set its upstream to the
                // existing node.
                upstream = chain.nodes.find(item => item.nodeName === StopNode.createNodeName(previous.name, previous.direction));
                if (!upstream) {
                    upstream = new StopNode(previous.name, false, previous.id, previous.direction);
                    upstream.setUpstream(chain.nodes.find(item => item.isFirst), false);
                    chain.nodes.push(upstream);
                }

                currentNode = new StopNode(currentEntry.name, false, currentEntry.id, currentEntry.direction);
                currentNode.setUpstream(upstream, false);
                chain.nodes.push(currentNode);

                // Iterate over the chain and determine if the current node has a
                // duplicate. If there are duplicates the node with the longest
                // upstream count will be left in the chain and the node with the
                // shortest upstream count will be removed. Remove any existing
                // downstream elements from the node to be removed and attach them
                // to the remaining node. Remove the node that has the shortest
                // count.
                duplicates = chain.nodes.filter(item => item.nodeName === currentNode.nodeName);
                if (duplicates.length < 2) {
                    continue;
                }

                ([dupe0, dupe1] = duplicates);
                if (dupe0.getUpstreamCount() === dupe1.getUpstreamCount()) {
                    index = chain.nodes.findIndex(item => item === currentNode);
                    remove = currentNode === dupe0 ? dupe0 : dupe1;
                    keep = currentNode === dupe0 ? dupe1 : dupe0;
                } else {
                    if (dupe0.getUpstreamCount() < dupe1.getUpstreamCount()) {
                        index = chain.nodes.findIndex(item => item === dupe0);
                        remove = dupe0;
                        keep = dupe1;
                    } else {
                        index = chain.nodes.findIndex(item => item === dupe1);
                        remove = dupe1;
                        keep = dupe0;
                    }
                }

                chain.nodes
                    .filter(item => {
                        const n = item.upstream;
                        return n && n.nodeName === remove.nodeName;
                    })
                    .forEach(item => {
                        const n = remove.downstream;
                        item.setUpstream(keep, n && n.nodeName === item.nodeName);
                    });

                chain.nodes.splice(index, 1);
            }

            logg.debug(() => `listener/route updateRouteStopsChain - chain:\r\n${JSON.stringify(chain.nodes.map(item => item.stringifiable()))}`);
        }
    }

}
