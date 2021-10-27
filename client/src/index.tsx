import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import rootReducer from './reducers/rootReducer';
import thunk from 'redux-thunk';
import { createMuiTheme, CssBaseline, ThemeProvider } from '@material-ui/core';
import { createLogger } from 'redux-logger';
import initAxios from './components/Axios';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';
import { version as appVersion } from '../package.json';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const isProduction = process.env.NODE_ENV === "production";

let middlewares: any = [thunk];
let composeEnhancers = compose;

if (!isProduction) {
  composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  const logger = createLogger();
  middlewares = [...middlewares, logger];
}

export const store = createStore(rootReducer, composeEnhancers(applyMiddleware(...middlewares)));

const theme = createMuiTheme({
  overrides: {
    MuiCssBaseline: {
      '@global': {
        '*::-webkit-scrollbar': {
          width: '0.4em'
        },
        '*::-webkit-scrollbar-track': {
          '-webkit-box-shadow': 'inset 0 0 6px rgba(0,0,0,0.00)'
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,.1)',
          borderRadius: '4px'
        }
      }
    },
    MuiTableCell: {
      sizeSmall: {
        padding: "6px 3px 6px 3px"
      }
    }
  },
});

initAxios();

ReactDOM.render(
  <React.Fragment>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Provider store={store}>
        <App />
        <ToastContainer />
      </Provider>
    </ThemeProvider>
  </React.Fragment>//StrictMode>
  , document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register({
  onUpdate: () => {
    localStorage.setItem("updateAvailable", appVersion);
    toast.success("New Update Available! Close your app to Update", {
      //eslint-disable-next-line
      onClick: () => window.location.reload(true)
    })
  }
});
