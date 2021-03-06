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


import { Props as ButtonProps } from "@controls/button";
import * as React from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";


interface Props extends ButtonProps {
    to: string;
}


export default (props: Props): JSX.Element => {
    const { click, to, ...buttonProps } = props;

    let messageProps = buttonProps.content;
    if (typeof messageProps === "string") {
        messageProps = { id: messageProps };
    }

    const classNames = ["control", "button"];
    if (props.hasOwnProperty("isPrimary") && props.isPrimary) {
        classNames.push("btn-primary");
    }

    return (
        <div className={classNames.join(" ")}>
            <Link to={to}>
                <FormattedMessage  {...messageProps} />
            </Link>
        </div>
    );
};


export { Props };
