

import Button, { Props as ButtonProps } from "@controls/button";
import * as React from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";


interface Props extends ButtonProps {
    to: string;
}


export default (props: Props): JSX.Element => {
    const { to, ...buttonProps } = props;

    return (
        <Button {...buttonProps} isLink={true}>
            <Link to={to}>
                <FormattedMessage {...buttonProps.content} />
            </Link>
        </Button>
    );
};


export { Props };
