

// import Button, { Props as ButtonProps } from "./common/routeButton";
// import { State } from "../reducer/interfaces";
import * as React from "react";
// import { connect } from "react-redux";


/**
 * The props for Main component.
 * @interface Props
 */
interface Props {
}


// This is the container.
const main: React.StatelessComponent = (props: Props): JSX.Element => {
    return (<Main {...props } />);
};


/**
 * This is the presentational component to display main.
 * @param {Props} props 
 * @returns {JSX.Element} 
 */
const Main = (props: Props): JSX.Element => {
    return (
        <div>
            {"This is main."}
        </div>
    );
};


export default main;
