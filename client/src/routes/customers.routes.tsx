import React from 'react';
import {
    Switch,
    Route
} from "react-router-dom";
import CustomersHomePage from '../pages/CustomersHomePage';
import {customersPaths} from './paths.enum';

export default function CustomersRoutes() {
    return (
        <Switch>
            <Route path={customersPaths.home} >
                <CustomersHomePage/>
            </Route>
        </Switch>
    )
}