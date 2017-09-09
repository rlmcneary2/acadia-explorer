

import { ControlTextContent } from "./interfaces";
import * as React from "react";
import { FormattedMessage } from "react-intl";


interface Props {
    click?: (props: Props) => void;
    content: ControlTextContent;
    isPrimary?: boolean;
}


export default (props: Props): JSX.Element => {
    let content = null;
    if (props.content.id) {
        content = (<FormattedMessage {...props.content } />);
    }

    const classNames = [];
    if (props.hasOwnProperty("isPrimary") && props.isPrimary) {
        classNames.push("btn-primary");
    }

    return (
        <button className={classNames.join(" ")} onClick={clickHandler.bind(props)}>
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
