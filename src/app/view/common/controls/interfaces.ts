

interface ControlTextContent {
    id: string;
    values?: object;
}

interface ControlLinkContent extends ControlTextContent {
    to: string;
}

export { ControlLinkContent, ControlTextContent };
