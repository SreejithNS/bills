import React from 'react';
import {
    Switch,
    Route
} from "react-router-dom";
import NewBillModal from '../components/NewBillModal';
import BillsHomePage from '../pages/BillsHomePage';
import { billsPaths, paths } from './paths.enum';

export default function BillsRoutes() {
    return (
        <Switch>
            <Route exact path={paths.billsHome + billsPaths.home} >
                {"Bills Home page" + paths.billsHome + billsPaths.home}
                <BillsHomePage />
            </Route>
            <Route path={paths.billsHome + billsPaths.addBill} >
                {"Bill creation " + paths.billsHome + billsPaths.addBill}
                <NewBillModal />
            </Route>
        </Switch>
    )
}