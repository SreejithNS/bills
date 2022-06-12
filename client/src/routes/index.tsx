import React, { Suspense } from 'react';
import {
    Switch,
    Route
} from "react-router-dom";
import AppBottomNavigation from '../components/AppBottomNavigation';
import FullScreenLoading from '../components/FullScreenLoading';
import PrivateRoute from '../components/RouteContainer/PrivateRoute';
import CheckInsPage from '../pages/CheckInsPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import AccountRoutes from './account.routes';
import { paths } from './paths.enum';

// import NotFoundPage from '../pages/NotFoundPage';
// import HomePage from '../pages/HomePage';
//import BillsRoutes from './bills.routes';
//import CustomersRoutes from './customers.routes';
//import ItemsRoutes from './items.routes';

const HomePage = React.lazy(() => import('../pages/HomePage'));
const BillsRoutes = React.lazy(() => import('./bills.routes'));
// const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));
const CustomersRoutes = React.lazy(() => import('./customers.routes'));
const ItemsRoutes = React.lazy(() => import('./items.routes'));



export default function Routes() {
    return (
        <>
            <Switch>
                <PrivateRoute exact path={paths.home}>
                    <Suspense fallback={<FullScreenLoading />}>
                        <HomePage />
                    </Suspense>
                </PrivateRoute>
                <PrivateRoute path={paths.billsHome}>
                    <Suspense fallback={<FullScreenLoading />}>
                        <BillsRoutes />
                    </Suspense>
                </PrivateRoute>
                <PrivateRoute path={paths.customer}>
                    <Suspense fallback={<FullScreenLoading />}>
                        <CustomersRoutes />
                    </Suspense>
                </PrivateRoute>
                <PrivateRoute path={paths.items}>
                    <Suspense fallback={<FullScreenLoading />}>
                        <ItemsRoutes />
                    </Suspense>
                </PrivateRoute>
                <PrivateRoute path={paths.account}>
                    <Suspense fallback={<FullScreenLoading />}>
                        <AccountRoutes />
                    </Suspense>
                </PrivateRoute>
                <PrivateRoute path={paths.checkIn}>
                    <Suspense fallback={<FullScreenLoading />}>
                        <CheckInsPage />
                    </Suspense>
                </PrivateRoute>
                <Route path={paths.login}>
                    <Suspense fallback={<FullScreenLoading />}>
                        <LoginPage />
                    </Suspense>
                </Route>
                <Route> <NotFoundPage /> </Route>
            </Switch>
            <AppBottomNavigation />
        </>
    )
}