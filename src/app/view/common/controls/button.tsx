

import { ControlTextContent } from "./interfaces";
import * as React from "react";
import { FormattedMessage } from "react-intl";


interface Props {
    /**
     * Child elements to be displayed in the button. If children are provided
     * then content is ignored.
     * @type {JSX.Element}
     */
    children?: JSX.Element;
    click?: (props: Props) => void;
    content: ControlTextContent;
    isLink?: boolean;
    isPrimary?: boolean;
}


export default (props: Props): JSX.Element => {
    let content: JSX.Element = null;
    if (props.children) {
        content = props.children;
    } else if (props.content.id) {
        content = (<FormattedMessage {...props.content } />);
    }

    const classNames = ["control"];
    if (props.hasOwnProperty("isPrimary") && props.isPrimary) {
        classNames.push("btn-primary");
    }

    if (props.hasOwnProperty("isLink") && props.isLink) {
        classNames.push("btn-link");
    }

    const buttonProps: any = {
        onClick: clickHandler.bind(props)
    };

    if (0 < classNames.length) {
        buttonProps.className = classNames.join(" ");
    }

    return (
        <button {...buttonProps}>
            {content}
        </button>
    );
};


function clickHandler(evt) {
    if (this.click) {
        this.click(this);
    }
}


export { Props };
