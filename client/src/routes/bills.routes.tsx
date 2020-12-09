import React from 'react';
import {
    Switch,
    Route
} from "react-router-dom";
import BillViewerModal from '../components/BillViewerModal';
import NewBillModal from '../components/NewBillModal';
import BillsHomePage from '../pages/BillsHomePage';
import { billsPaths, paths } from './paths.enum';

export default function BillsRoutes() {
    return (
        <Switch>
            <Route exact path={paths.billsHome + billsPaths.home} >
                <BillsHomePage />
            </Route>
            <Route path={paths.billsHome + billsPaths.addBill} >
                <NewBillModal />
            </Route>
            <Route path={paths.billsHome + billsPaths.billDetail} >
                <BillViewerModal />
            </Route>
        </Switch>
    )
}