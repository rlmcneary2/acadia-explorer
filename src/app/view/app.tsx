/*
 * Copyright (c) 2017 Richard L. McNeary II
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


import { DropdownList, Props as DropdownProps } from "@controls/dropdownList";
import { ControlLinkContent, ControlTextContent } from "@controls/interfaces";
import LinkButton, { Props as LinkButtonProps } from "@controls/linkButton";
import * as React from "react";
import { connect } from "react-redux";
import { Redirect, Route } from "react-router-dom";
import { isNumber } from "util";
import { State } from "../reducer/interfaces";
import IslandExplorerRoute from "./route";
import Welcome from "./welcome";


interface Props {
    routes?: any[];
}

interface ComponentState {
    showRoutesMenu: boolean;
}

class App extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
        this.state = { showRoutesMenu: false };
    }

    public state: ComponentState;

    private get routeId(): number | null {
        const matches = /^\/route\/(\d+)\/?(?:([\w\-]+))?$/.exec((this.props as any).location.pathname);
        if (!matches || matches.length < 2) {
            return null;
        }

        const [, id] = matches;
        const routeId = parseInt(id, 10);
        if (!isNumber(routeId)) {
            return null;
        }

        return routeId;
    }

    public render() {
        const routeId = this.routeId;

        // If the path to a route is corrupted redirect back to the main page.
        if (!this.validRoute(routeId)) {
            return (<Redirect to="/" />);
        }

        // Only show the toggle button if a route has been chosen. routeId will
        // be null - but valid - if the current path is to the root ("/"). So if
        // routeId is null the user has not yet chosen a route.
        let toggle: JSX.Element = null;
        if (routeId !== null) {
            const isShowMap = !(this.props as any).location.pathname.endsWith("info");
            const linkButtonProps: LinkButtonProps = {
                content: {
                    id: !isShowMap ? "MAP" : "INFO"
                },
                to: !isShowMap ? `/route/${routeId}/map` : `/route/${routeId}/info`
            };

            toggle = (
                <li className="menu-item info-toggle">
                    <LinkButton {...linkButtonProps} />
                </li>
            );
        }

        return (
            <div className="application">
                <nav className="control-container header">
                    <menu className="header">
                        <li className="menu-item routes">
                            {this.createRoutesMenu()}
                        </li>
                        {toggle}
                    </menu>
                </nav>
                <Route component={IslandExplorerRoute} path="/route/:id" />
                <Route component={Welcome} path="/welcome" />
            </div>
        );
    }

    private createRoutesMenu(): JSX.Element {
        const { routes = [] } = this.props;
        const items: ControlLinkContent[] = routes.map(item => {
            return {
                text: item.LongName,
                to: `/route/${item.RouteId}/map`
            };
        });

        // Build the current item based on the current URL.
        let selectedItem: ControlTextContent | ControlLinkContent;

        const routeId = this.routeId;

        if (routes.length && routeId !== null) {
            selectedItem = items.find(clc => clc.to.startsWith(`/route/${routeId}`));
        }

        const dropdownProps: DropdownProps = {
            display: "modal",
            items,
            placeHolder: { id: "ROUTE-NOT_SELECTED" },
            selectedItem
        };

        return (
            <DropdownList {...dropdownProps} />
        );
    }

    private validRoute(id: number): boolean {
        if (id === null) {
            // id will be null when navigating to the root path; in this case a
            // null id is valid.
            if ((this.props as any).location.pathname === "/") {
                return true;
            }

            return false;
        }

        if (id < 1) {
            return false;
        }

        const { routes } = this.props;
        if (routes && 0 < routes.length && !routes.some(item => item.RouteId === id)) {
            return false;
        }

        return true;
    }
}


export default connect(mapStateToProps)(props => {
    return (<App {...props} />);
});


function mapStateToProps(state: State): Props {
    return state.api;
}
