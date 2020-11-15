import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import rootReducer from './reducers/rootReducer';
import thunk from 'redux-thunk';
import { CssBaseline } from '@material-ui/core';
import { createLogger } from 'redux-logger';

const logger = createLogger({
  // ...options
});
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk, logger)));

ReactDOM.render(
  <React.Fragment>
    <CssBaseline />
    <Provider store={store}>
      <App />
    </Provider>
  </React.Fragment>//StrictMode>
  , document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
