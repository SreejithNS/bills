import React, { Component } from 'react';
import { Container, Grid } from '@material-ui/core';
import { connect } from 'react-redux';
import CustomerCard from '../components/CustomerCard';
import { deleteCustomer, fetchCustomerList } from '../actions/customer.action';
import { ThunkDispatch } from 'redux-thunk';

interface DispatchProps {
    getCustomers(): void;
    deleteCustomer(id: string): void;
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
        const { customersList, listLoading, deleteCustomer } = this.props;
        return (
            <Container fixed>
                <Grid
                    container
                    direction="column"
                    justify="flex-start"
                    alignItems="stretch"
                    spacing={1}
                >
                    {!listLoading && customersList.map(({ name, phone, _id }, key) =>
                        <Grid item xs={12} key={key} >
                            < CustomerCard customerName={name} phone={phone} delete={() => deleteCustomer(_id)} />
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
    getCustomers: () => dispatch(fetchCustomerList()),
    deleteCustomer: (id: string) => dispatch(deleteCustomer(id))
});


export default connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(CustomerHomePage);