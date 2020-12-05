import React, { Suspense } from 'react';
import {
    Switch,
    Route
} from "react-router-dom";
import AppBottomNavigation from '../components/AppBottomNavigation';
import FullScreenLoading from '../components/FullScreenLoading';
import AccountRoutes from './account.routes';
import { paths } from './paths.enum';

// import NotFoundPage from '../pages/NotFoundPage';
import HomePage from '../pages/HomePage';
//import BillsRoutes from './bills.routes';
//import CustomersRoutes from './customers.routes';
//import ItemsRoutes from './items.routes';

// const HomePage = React.lazy(() => import('../pages/HomePage'));
const BillsRoutes = React.lazy(() => import('./bills.routes'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));
const CustomersRoutes = React.lazy(() => import('./customers.routes'));
const ItemsRoutes = React.lazy(() => import('./items.routes'));



export default function Routes() {
    return (
        <><Switch>
            <Route exact path={paths.home}>
                <HomePage />
            </Route>
            <Route path={paths.billsHome}>
                <Suspense fallback={<FullScreenLoading />}>
                    <BillsRoutes />
                </Suspense>
            </Route>
            <Route path={paths.customer}>
                <Suspense fallback={<FullScreenLoading />}>
                    <CustomersRoutes />
                </Suspense>
            </Route>
            <Route path={paths.items}>
                <Suspense fallback={<FullScreenLoading />}>
                    <ItemsRoutes />
                </Suspense>
            </Route>
            <Route path={paths.account}>
                <Suspense fallback={<FullScreenLoading />}>
                    <AccountRoutes />
                </Suspense>
            </Route>
            {/* <Route>
                <Suspense fallback={<FullScreenLoading />}>
                    <NotFoundPage />
                </Suspense>
            </Route> */}
        </Switch>
            <AppBottomNavigation /></>
    )
}