import React from 'react';
import {
    Switch,
    Route
} from "react-router-dom";
import BillsHomePage from '../pages/BillsHomePage';
import {billsPaths} from './paths.enum';

export default function BillsRoutes() {
    return (
        <Switch>
            <Route path={billsPaths.home} >
                <BillsHomePage/>
            </Route>
        </Switch>
    )
}