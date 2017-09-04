

import Main from "../main";
import Route from "../route";
import Routes from "../routes";
import { location } from "react-router-dom";


interface Data {
    component: React.Component | React.StatelessComponent;
    exact?: boolean;
    matcher?: RegExp;
    path: string;
}

class RouterData {

    public static routes: Data[] = [
        {
            component: Main,
            path: "/"
        },
        {
            component: Route,
            matcher: /^\/routes\/[0-9]*/,
            path: "/routes/:id"
        },
        {
            component: Routes,
            exact: true,
            path: "/routes"
        },
    ];

    public static findData(location: location): Data {
        const route = this.routes.find(item => item.matcher ? item.matcher.test(location.pathname) : item.path === location.pathname);
        return route;
    }
}


export default RouterData;
