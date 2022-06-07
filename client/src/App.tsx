import React, { } from 'react';
import {
  BrowserRouter as Router
  //Link
} from "react-router-dom";
import Routes from './routes';
import { ConfirmProvider } from 'material-ui-confirm';
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