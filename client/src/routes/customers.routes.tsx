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
                {"home"}
                <CustomersHomePage />
            </Route>
            <Route path={paths.customer + customersPaths.createCustomer} >
                {"create"}
                <NewCustomerCreationModal />
            </Route>
        </React.Fragment>
    )
}