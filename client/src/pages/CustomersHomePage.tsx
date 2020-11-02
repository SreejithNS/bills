import React, { Component } from 'react';
import { Container, Grid } from '@material-ui/core';
import { connect } from 'react-redux';
import CustomerCard from '../components/CustomerCard';
import { fetchCustomerList } from '../actions/customer.action';
import { ThunkDispatch } from 'redux-thunk';

interface DispatchProps {
    getCustomers(): void;
}

interface StateProps {
    customersList: any[];
    listLoadingError: string;
    listLoading: boolean;
}

type Props = DispatchProps & StateProps

class CustomerHomePage extends Component<Props> {

    componentDidMount() {
        const { getCustomers } = this.props;
        getCustomers();
    }

    render() {
        return (
            <Container fixed>
                <Grid
                    container
                    direction="column"
                    justify="flex-start"
                    alignItems="center"
                    spacing={1}
                >
                    {[...Array(12)].map((e, k) =>
                        <Grid item key={k} >
                            {/* <Typography component="div" style={{ backgroundColor: '#cfe8fc' }} >Hello </Typography> */}
                            <CustomerCard />
                        </Grid>
                    )}
                </Grid>
            </Container>
        )
    }
}

const mapStateToProps = (state: any) => {
    return {
        ...state.customer
    }
};

const mapDispatchToProps = (dispatch: ThunkDispatch<{}, {}, any>) => ({
    getCustomers: () => dispatch(fetchCustomerList())
});


export default connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(CustomerHomePage);