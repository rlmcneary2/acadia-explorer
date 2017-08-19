

import { http } from "./network/http";


export default async () => {

    const reactRoot = document.createElement("div");
    reactRoot.id = "react-root";
    document.body.appendChild(reactRoot);

    // https://islandexplorertracker.availtec.com/InfoPoint/rest/Routes/GetVisibleRoutes?_=1503169502866
    const url = `https://islandexplorertracker.availtec.com/InfoPoint/rest/Routes/GetVisibleRoutes?_${Date.now()}`;
    const response = await http.get(url);
    console.log("response: %O", response);
};
