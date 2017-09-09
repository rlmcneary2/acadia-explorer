

import { ControlLinkContent, ControlTextContent } from "./interfaces";
import * as React from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";


interface Props {
    items: ControlTextContent[] | ControlLinkContent[];
}


class Menu extends React.Component<Props, JSX.Element> {

    public render(): JSX.Element {
        const items = this.createListItems();
        return this.createList(items);
    }

    private createList(items: JSX.Element[]): JSX.Element {
        const list = (<ul role="group">{items}</ul>);
        if (isNavigationItemArray(this.props.items)) {
            return (<nav role="menu">{list}</nav>);
        } else {
            return (<div role="menu">{list}</div>);
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

            return (<li key={item.id} role="menuitem">{content}</li>);
        });
    }

}


export default Menu;
export { Props };


function isNavigationItem(item: any): item is ControlLinkContent {
    return item.to !== undefined;
}

function isNavigationItemArray(items: any[]): items is ControlLinkContent[] {
    return isNavigationItem(items[0]);
}
