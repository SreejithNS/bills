import React from 'react';
import {
  BrowserRouter as Router,
  //Link
} from "react-router-dom";
import Routes from './routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <main>
      <ToastContainer />
      <Router>
        <Routes />
      </Router>
    </main>
  );
}

export default App;
