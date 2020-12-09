import React from 'react';
import {
    Route
} from "react-router-dom";
import NewItemModal from '../components/NewItemModal';
import ItemsHomePage from '../pages/ItemsHomePage';
import { itemPaths, paths } from './paths.enum';

export default function ItemsRoutes() {
    return (
        <React.Fragment>
            <Route exact path={paths.items + itemPaths.home} >
                <ItemsHomePage />
            </Route>
            <Route path={paths.items + itemPaths.addItem} >
                <NewItemModal />
            </Route>
        </React.Fragment>
    )
}