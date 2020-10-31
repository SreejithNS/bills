import React from 'react';
import {
    Switch,
    Route
} from "react-router-dom";
import HomePage from '../pages/HomePage';
import BillsRoutes from './bills.routes';
import {paths} from './paths.enum';

export default function Routes() {
    return (
        <Switch>
            <Route exact path={paths.home} >
                <HomePage/>
            </Route>
            <Route path={paths.billsHome} >
                <BillsRoutes/>
            </Route>
        </Switch>
    )
}