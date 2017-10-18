

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


    private _onNavigationMenuButtonClick = () => {
        this.setState({ showRoutesMenu: false });
    };

    private createRoutesMenu: () => JSX.Element = () => {
        if (!this.state.showRoutesMenu) {
            return null;
        }

        if (!this.props.routes) {
            return (<div>WORKING</div>);
        }

        let items: ControlLinkContent[] = this.props.routes.map(item => {
            return {
                id: item.LongName,
                to: `/route/${item.RouteId}`
            };
        });

        items = [{
            id: "NONE",
            to: "/"
        }, ...items];

        const menuProps: MenuProps = {
            items
        };

        (menuProps as any).select = this._onNavigationMenuButtonClick;

        return (
            <Menu {...menuProps} />
        );
    };
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
