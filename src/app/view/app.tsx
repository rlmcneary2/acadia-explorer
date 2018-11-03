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
import * as React from "react";
import { connect } from "react-redux";
import { Route } from "react-router-dom";
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

    public render() {
        return (
            <div className="application">
                <nav className="control-container header">
                    <menu className="header">
                        <li>
                            {this.createRoutesMenu()}
                        </li>
                    </menu>
                </nav>
                <Route component={Welcome} path="/welcome" />
                <Route component={IslandExplorerRoute} path="/route/:id" />
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
        const matches = /^\/route\/(\d+)\/?(?:([\w\-]+))?$/.exec((this.props as any).location.pathname);

        if (routes.length && matches && matches.length) {
            selectedItem = items.find(clc => clc.to.startsWith(`/route/${matches[1]}`));
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
}


export default connect(mapStateToProps)(props => {
    return (<App {...props} />);
});


function mapStateToProps(state: State): Props {
    return state.api;
}
