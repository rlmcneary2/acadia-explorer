

import Button, { Props as ButtonProps } from "./button";
import * as React from "react";
import { Route } from "react-router-dom";


interface Props extends ButtonProps {
    url: URL;
}


export default (props: Props) => {
    return (
        <Route render={(router) => {
            const p = Object.assign({}, props);
            let u = `${props.url.pathname}`;
            if (props.url.search) {
                u += `?${props.url.search}`;
            }
            if (props.url.hash) {
                u += `#${props.url.hash}`;
            }
            p.click = () => router.history.push(u);
            return (<Button {...p} />);
        }
        } />
    );
};


export { Props };
