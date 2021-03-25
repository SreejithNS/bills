import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router
  //Link
} from "react-router-dom";
import Routes from './routes';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from 'react-redux';
import FullScreenLoading from './components/FullScreenLoading';
import useAxios from "axios-hooks";
import { APIResponse, handleAxiosError } from './components/Axios';
import { UserData } from './reducers/auth.reducer';
import { ConfirmProvider } from 'material-ui-confirm';
import { useAuthActions, useProductCategoryActions, useUsersUnderAdmin } from './actions/auth.actions';

// type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

// class App extends React.Component<Props> {

//   componentDidMount() {
//     this.props.getUserData();
//   }

//   render() {
//     const { userDataLoading } = this.props;
//     return (
//       <main style={{ height: "100vh" }}>
//         <ToastContainer />
//         {!userDataLoading ? <Router>
//           <Routes />
//         </Router> : <FullScreenLoading />}
//       </main>
//     );
//   }
// }

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
      <ToastContainer />
      <ConfirmProvider>
        {init ? <Router>
          <Routes />
        </Router> : <FullScreenLoading />}
      </ConfirmProvider>
    </main>
  )
}

// const mapStateToProps = (state: { app: { userDataLoading: any; }; }) => {
//   return {
//     userDataLoading: state.app.userDataLoading
//   }
// }

// const mapDispatchToProps = (dispatch: any) => {
//   return {
//     getUserData: () => dispatch(fetchUserData())
//   }
// }

// export default connect(mapStateToProps, mapDispatchToProps)(App);
