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
import { CSSTransition } from "react-transition-group";
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
        this.menuClickBound = this.menuClick.bind(this);
        this.selectBound = this.select.bind(this);
    }

    public componentWillUnmount() {
        this.buttonClickBound = null;
        this.menuClickBound = null;
        this.selectBound = null;
    }

    public render(): JSX.Element {
        if (!this.props.items.length) {
            return null;
        }

        logg.debug(() => `DropdownList render - this.state.expanded: ${this.state.expanded}`);
        const { placeHolder, select, selectedItem, ...menuProps } = this.props;

        const buttonContent = this.props.items && this.props.items.length && selectedItem ? selectedItem : placeHolder;
        const buttonProps: ButtonProps = {
            click: this.buttonClickBound,
            content: this.isControlLinkContent(buttonContent) ? buttonContent.text : buttonContent
        };

        (menuProps as any).select = this.selectBound;

        return (
            <div className={this.className}  onClick={this.menuClickBound}>
                <Button {...buttonProps} />
                <CSSTransition classNames="routes-menu" in={this.state.expanded} timeout={200}>
                    <Menu {...menuProps} />
                </CSSTransition>
            </div>
        );
    }


    private buttonClickBound: (props: ButtonProps, evt: React.MouseEvent) => void;
    private get className(): string {
        const { align, display } = this.props;
        let name = "dropdown-list";
        if (display === "modal") {
            name += " modal";
        }

        if (display === "modal" || align === "center") {
            name += " center";
        } else if (align === "right") {
            name += " right";
        } else {
            name += " left";
        }

        return name;
    }
    private menuClickBound: () => void;
    private selectBound: (selected: ControlTextContent | ControlLinkContent, evt: Event) => void;

    private buttonClick(props: ButtonProps, evt: Event): void {
        logg.debug(() => "DropdownList buttonClick - enter.");
        evt.stopPropagation();
        this.setState({ expanded: !this.state.expanded });
    }

    private isControlLinkContent(obj: object): obj is ControlLinkContent {
        if (!obj) {
            return false;
        }

        return obj.hasOwnProperty("to");
    }

    private menuClick(): void {
        logg.debug(() => "DropdownList menuClick - enter.");
        this.setState({ expanded: false });
    }

    private select(selectedItem: ControlTextContent | ControlLinkContent, evt: Event) {
        evt.stopPropagation();
        this.setState({ expanded: false });

        if (this.props.select) {
            this.props.select(selectedItem);
        }
    }

}


export interface Props extends MenuProps {
    align?: "center" | "left" | "right";
    display?: "modal";
    placeHolder?: ControlTextContent;
    selectedItem: ControlTextContent | ControlLinkContent;
}

interface State {
    expanded: boolean;
}
