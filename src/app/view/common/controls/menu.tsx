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


import * as React from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";
import logg from "../../../util/logg";
import { ControlLinkContent, ControlTextContent } from "./interfaces";


interface Props {
    items: ControlTextContent[] | ControlLinkContent[];
    select?: (control: ControlTextContent | ControlLinkContent, evt?: React.MouseEvent) => string;
}


class Menu extends React.PureComponent<Props, JSX.Element> {

    public render(): JSX.Element {
        const items = this.createListItems();
        return this.createList(items);
    }


    private createList(items: JSX.Element[]): JSX.Element {
        const list = (
            <div className="menu-container">
                <div className="menu-padding">
                    <ul className="menu" role="group">{items}</ul>
                </div>
            </div>
        );
        if (isNavigationItemArray(this.props.items)) {
            return (<nav className="menu-location" role="menu">{list}</nav>);
        } else {
            return (<div className="menu-location" role="menu">{list}</div>);
        }
    }

    private createListItems(): JSX.Element[] {
        if (this.props.items.length < 1) {
            return null;
        }

        const items = [...this.props.items];

        logg.debug(() => `createListItems - item count: ${items.length}.`, "menu");

        return (items as ControlLinkContent[]).map<JSX.Element>(item => {
            let content: JSX.Element;
            let key: string;
            if (typeof item.text === "string") {
                content = (<span>{item.text}</span>);
                key = item.text;
            } else {
                content = (<FormattedMessage id={item.text.id} values={item.text.values} />);
                key = item.text.id;
            }

            if (isNavigationItem(item)) {
                content = (<Link to={item.to}>{content}</Link>);
            }

            let onClick = null;
            if (this.props.select) {
                onClick = (evt: React.MouseEvent) => {
                    logg.debug(() => `createListItems - clicked: ${item.text}(${(item.text as any).id ? (item.text as any).id : item.text}).`, "menu");
                    this.props.select(item, evt);
                };
            }

            const liProps = {
                className: "menu-item",
                onClick,
                role: "menuitem"
            };

            return (
                <li key={key} {...liProps}>{content}</li>
            );
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
