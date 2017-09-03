

import * as React from "react";
const { FormattedMessage } = require("react-intl");


interface Props {
    click?: (props: Props) => void;
    content: PropStringContent;
    isPrimary?: boolean;
}

interface PropStringContent {
    id: string;
    values?: {};
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
