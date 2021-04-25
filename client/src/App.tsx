import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router
  //Link
} from "react-router-dom";
import Routes from './routes';
import FullScreenLoading from './components/FullScreenLoading';
import { ConfirmProvider } from 'material-ui-confirm';
import { useAuthActions, useProductCategoryActions, useUsersUnderAdmin } from './actions/auth.actions';

export default function App() {
  const { initiated: init1 } = useAuthActions();
  const { initiated: init2 } = useUsersUnderAdmin();
  const { initiated: init3 } = useProductCategoryActions();
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (!init && (init1 && init2 && init3)) {
      setInit(true);
    }
  }, [init1, init2, init3, init]);

  return (
    <main style={{ height: "100vh" }}>
      <ConfirmProvider>
        {init ? <Router>
          <Routes />
        </Router> : <FullScreenLoading />}
      </ConfirmProvider>
    </main>
  )
}