import React from 'react';
import {
    Route
} from "react-router-dom";
import AccountPage from '../pages/AccountPage';
import NewSalesmanModal from "../components/NewSalesmanModal";
import { accountPaths, paths } from './paths.enum';
import UserEditModal from '../components/UserEditModal';
import UpdateUserAccountModal from '../components/UpdateUserAccountModal';

export default function AccountRoutes() {
    return (
        <React.Fragment>
            <Route exact path={paths.account + accountPaths.home} >
                <AccountPage />
            </Route>
            <Route path={paths.account + accountPaths.addSalesman} >
                <NewSalesmanModal />
            </Route>
            <Route path={paths.account + accountPaths.editSalesman} >
                <UserEditModal />
            </Route>
            <Route path={paths.account + accountPaths.editAccount} >
                <UpdateUserAccountModal />
            </Route>
        </React.Fragment>
    )
}