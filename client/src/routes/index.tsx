import React, { Suspense } from 'react';
import {
    Switch,
    Route
} from "react-router-dom";
import AppBottomNavigation from '../components/AppBottomNavigation';
import FullScreenLoading from '../components/FullScreenLoading';
import { paths } from './paths.enum';

const HomePage = React.lazy(() => import('../pages/HomePage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));
const BillsRoutes = React.lazy(() => import('./bills.routes'));
const CustomersRoutes = React.lazy(() => import('./customers.routes'));
const ItemsRoutes = React.lazy(() => import('./items.routes'));

//import HomePage from '../pages/HomePage';
//import NotFoundPage from '../pages/NotFoundPage';
//import BillsRoutes from './bills.routes';
//import CustomersRoutes from './customers.routes';
//import ItemsRoutes from './items.routes';

export default function Routes() {
    return (
        <><Switch>
            <Route exact path={paths.home}>
                <Suspense fallback={<FullScreenLoading />}>
                    <HomePage />
                </Suspense>

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
            <Route path='*' exact={true} component={NotFoundPage} />
        </Switch>
            <AppBottomNavigation /></>
    )
}