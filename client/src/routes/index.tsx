import React from 'react';
import {
    Switch,
    Route
} from "react-router-dom";
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import BillsRoutes from './bills.routes';
import CustomersRoutes from './customers.routes';
import ItemsRoutes from './items.routes';
import { paths } from './paths.enum';

export default function Routes() {
    return (
        <Switch>
            <Route exact path={paths.home} >
                <HomePage />
            </Route>
            <Route path={paths.billsHome} >
                <BillsRoutes />
            </Route>
            <Route path={paths.customer} >
                <CustomersRoutes />
            </Route>
            <Route path={paths.items} >
                <ItemsRoutes />
            </Route>
            <Route path='*' exact={true} component={NotFoundPage} />
        </Switch>
    )
}