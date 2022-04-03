import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router
  //Link
} from "react-router-dom";
import Routes from './routes';
import FullScreenLoading from './components/FullScreenLoading';
import { ConfirmProvider } from 'material-ui-confirm';
import { useAuthActions, useProductCategoryActions, useUsersUnderAdmin } from './actions/auth.actions';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

export default function App() {


  return (
    <main style={{ height: "100vh" }}>
      <MuiPickersUtilsProvider utils={MomentUtils}>
        <ConfirmProvider>
          <Router>
            <Routes />
          </Router>
        </ConfirmProvider>
      </MuiPickersUtilsProvider>
    </main>
  )
}