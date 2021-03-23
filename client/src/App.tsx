import React, { useEffect } from 'react';
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
import { APIResponse } from './components/Axios';
import { UserData } from './reducers/auth.reducer';
import { ConfirmProvider } from 'material-ui-confirm';

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
  const [{ data, loading, error }] = useAxios<APIResponse<UserData>>('/auth/');
  const dispatch = useDispatch();

  useEffect(() => {
    if (error) {
      toast.error("User Authentication Failed");
    }
    if (data) {
      dispatch({ type: "USER_DATA", payload: data.data });
    }
    dispatch({ type: "USER_DATA_LOAD", payload: loading });
  })


  return (
    <main style={{ height: "100vh" }}>
      <ToastContainer />
      <ConfirmProvider>
        {!loading ? <Router>
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
