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


import { ControlLinkContent } from "@controls/interfaces";
import Menu, { Props as MenuProps } from "@controls/menu";
import * as React from "react";
import { Route } from "react-router-dom";
import { connect } from "react-redux";
import { CSSTransitionGroup } from "react-transition-group";
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

    constructor(
        public state: ComponentState,
        private _toggleNavigationMenuDisplay: () => void
    ) {
        super();
        this.state = { showRoutesMenu: false };
        this._toggleNavigationMenuDisplay = toggleNavigationMenuDisplay.bind(this);
    }

    public render() {
        const routesMenu = this.createRoutesMenu();

        // const anyProps = this.props as any;
        // if (anyProps.location.pathname && (anyProps.location.pathname as string).indexOf("welcome") < 1) {
        //     setTimeout(() => {
        //         anyProps.history.push("/welcome");
        //     });
        // }

        return (
            <div className="application">
                <nav className="header">
                    <menu className="header">
                        <li>
                            <button className="control" onClick={this._toggleNavigationMenuDisplay}>
                                <span>Routes</span>
                            </button>
                        </li>
                    </menu>
                </nav>
                <Route component={Welcome} path="/welcome" />
                <Route component={IslandExplorerRoute} path="/route/:id" />
                <CSSTransitionGroup component="div" id="routes-menu-transition" transitionEnterTimeout={300} transitionLeaveTimeout={300} transitionName="routes-menu">
                    {routesMenu}
                </CSSTransitionGroup>
            </div>
        );
    }


    private _onNavigationMenuButtonClick() {
        this.setState({ showRoutesMenu: false });
    }

    private createRoutesMenu(): JSX.Element {
        if (!this.state.showRoutesMenu) {
            return null;
        }

        if (!this.props.routes) {
            return (<div>WORKING</div>);
        }

        let items: ControlLinkContent[] = this.props.routes.map(item => {
            return {
                text: item.LongName,
                to: `/route/${item.RouteId}`
            };
        });

        items = [{
            text: { id: "NONE" },
            to: "/"
        }, ...items];

        const menuProps: MenuProps = {
            items
        };

        (menuProps as any).select = this._onNavigationMenuButtonClick;

        return (
            <Menu {...menuProps} />
        );
    }
}


export default connect(mapStateToProps)(props => {
    return (<App {...props} />);
});


function mapStateToProps(state: State): Props {
    return state.api;
}

function toggleNavigationMenuDisplay() {
    this.setState({ showRoutesMenu: !this.state.showRoutesMenu });
}
