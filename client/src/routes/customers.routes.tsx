import React from 'react';
import {
    Route
} from "react-router-dom";
import NewCustomerCreationModal from '../components/NewCustomerCreationModal';
import CustomersHomePage from '../pages/CustomersHomePage';
import { customersPaths, paths } from './paths.enum';

export default function CustomersRoutes() {
    return (
        <React.Fragment>
            <Route exact path={paths.customer + customersPaths.home} >
                <CustomersHomePage />
            </Route>
            <Route path={paths.customer + customersPaths.createCustomer} >
                <NewCustomerCreationModal />
            </Route>
        </React.Fragment>
    )
}