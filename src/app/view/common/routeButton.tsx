

import Button, { Props as ButtonProps } from "./button";
import * as React from "react";
import { Route } from "react-router-dom";
import { actionUi } from "../../action/ui";


interface Props extends ButtonProps {
    url: URL | string;
    viewData?: any;
}


export default (props: Props) => {
    return (
        <Route render={(router) => {
            const p = Object.assign({}, props);

            let u;
            if (props.url instanceof URL) {
                u = `${props.url.pathname}`;
                if (props.url.search) {
                    u += props.url.search;
                }
                if (props.url.hash) {
                    u += props.url.hash;
                }
            } else {
                u = props.url;
            }

            p.click = () => {
                router.history.push(u);

                if (props.viewData) {
                    actionUi.setViewData(props.viewData);
                }
            };

            return (<Button {...p} />);
        }
        } />
    );
};


export { Props };
