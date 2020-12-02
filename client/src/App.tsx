import React from 'react';
import {
  BrowserRouter as Router
  //Link
} from "react-router-dom";
import Routes from './routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { connect } from 'react-redux';
import FullScreenLoading from './components/FullScreenLoading';
import { fetchUserData } from './actions/app.actions';


type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

class App extends React.Component<Props> {

  componentDidMount() {
    this.props.getUserData();
  }

  render() {
    const { userDataLoading } = this.props;
    return (
      <main style={{ height: "100vh" }}>
        <ToastContainer />
        {!userDataLoading ? <Router>
          <Routes />
        </Router> : <FullScreenLoading />}
      </main>
    );
  }
}

const mapStateToProps = (state: { app: { userDataLoading: any; }; }) => {
  return {
    userDataLoading: state.app.userDataLoading
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    getUserData: () => dispatch(fetchUserData())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
