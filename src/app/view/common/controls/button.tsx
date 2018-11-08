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
import { ControlTextContent } from "./interfaces";


interface Props {
    /**
     * Child elements to be displayed in the button. If children are provided
     * then content is ignored.
     */
    children?: JSX.Element;
    click?: (props: Props, evt: React.MouseEvent) => void;
    content: ControlTextContent | string;
    isPrimary?: boolean;
}


export default (props: Props): JSX.Element => {
    let content: JSX.Element = null;
    if (props.children) {
        content = props.children;
    } else {
        if (typeof props.content === "string") {
            content = (<span>{props.content}</span>);
        } else {
            content = (<FormattedMessage {...props.content} />);

        }
    }

    const classNames = ["control"];
    if (props.hasOwnProperty("isPrimary") && props.isPrimary) {
        classNames.push("btn-primary");
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


function clickHandler(evt: React.MouseEvent) {
    if (this.click) {
        this.click(this, evt);
    }
}


export { Props };
