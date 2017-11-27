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


import { ControlLinkContent, ControlTextContent } from "./interfaces";
import * as React from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";


interface Props {
    items: ControlTextContent[] | ControlLinkContent[];
    select?: (control: ControlTextContent | ControlLinkContent) => string;
}


class Menu extends React.Component<Props, JSX.Element> {

    public render(): JSX.Element {
        const items = this.createListItems();
        return this.createList(items);
    }


    private createList(items: JSX.Element[]): JSX.Element {
        const list = (<ul className="menu" role="group">{items}</ul>);
        if (isNavigationItemArray(this.props.items)) {
            return (<nav className="menu-container" role="menu">{list}</nav>);
        } else {
            return (<div className="menu-container" role="menu">{list}</div>);
        }
    }

    private createListItems(): JSX.Element[] {
        if (this.props.items.length < 1) {
            return null;
        }

        return (this.props.items as ControlTextContent[]).map((item): JSX.Element => {
            let content: JSX.Element = (<FormattedMessage id={item.id} values={item.values} />);

            if (isNavigationItem(item)) {
                content = (<Link to={item.to}>{content}</Link>);
            }

            let clickHandler;
            if (this.props.select) {
                clickHandler = () => {
                    this.props.select(item);
                };
            }

            return (<li className="menu-item" key={item.id} onClick={clickHandler} role="menuitem">{content}</li>);
        });
    }

}


export default Menu;
export { Props };


function isNavigationItem(item: any): item is ControlLinkContent {
    return item.to !== undefined;
}

function isNavigationItemArray(items: any[]): items is ControlLinkContent[] {
    if (!items || items.length < 1) {
        return false;
    }

    return isNavigationItem(items[0]);
}
