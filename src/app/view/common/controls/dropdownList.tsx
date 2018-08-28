/*
 * Copyright (c) 2018 Richard L. McNeary II
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


import logg from "@util/logg";
import * as React from "react";
import Button, { Props as ButtonProps } from "./button";
import { ControlLinkContent, ControlTextContent } from "./interfaces";
import Menu, { Props as MenuProps } from "./menu";


export class DropdownList extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = { expanded: false };
    }

    public componentDidMount() {
        this.buttonClickBound = this.buttonClick.bind(this);
        this.selectBound = this.select.bind(this);
    }

    public componentWillUnmount() {
        this.buttonClickBound = null;
        this.selectBound = null;
    }

    public render(): JSX.Element {
        if (!this.props.items.length) {
            return null;
        }

        logg.debug(() => `DropdownList render - this.state.expanded: ${this.state.expanded}`);
        const selectedItem = this.props.selectedItem;
        const buttonProps: ButtonProps = {
            click: this.buttonClickBound,
            content: this.isControlLinkContent(selectedItem) ? selectedItem.text : selectedItem
        };

        const { select, ...menuProps } = this.props;
        (menuProps as any).select = this.selectBound;

        let menu: JSX.Element = null;
        if (this.state.expanded) {
            menu = (<Menu {...menuProps} />);
        }

        return (
            <div className="dropdown-list">
                <Button {...buttonProps} />
                {menu}
            </div>
        );
    }


    private buttonClickBound: (props: ButtonProps) => void;
    private selectBound: (selected: ControlTextContent | ControlLinkContent) => void;

    private buttonClick(props: ButtonProps): void {
        logg.debug(() => "DropdownList buttonClick - enter.");
        this.setState({ expanded: !this.state.expanded });
    }

    private isControlLinkContent(obj: object): obj is ControlLinkContent {
        if (!obj) {
            return false;
        }

        return obj.hasOwnProperty("to");
    }

    private select(selectedItem: ControlTextContent | ControlLinkContent) {
        this.setState({ expanded: false });

        if (this.props.select) {
            this.props.select(selectedItem);
        }
    }

}


export interface Props extends MenuProps {
    selectedItem: ControlTextContent | ControlLinkContent;
}

interface State {
    expanded: boolean;
}
