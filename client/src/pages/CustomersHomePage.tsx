import React, { Component } from 'react';
import { Container, createStyles, Fab, Grid, Theme, WithStyles, withStyles } from '@material-ui/core';
import { connect } from 'react-redux';
import CustomerCard from '../components/CustomerCard';
import { deleteCustomer, fetchCustomerList } from '../actions/customer.action';
import { ThunkDispatch } from 'redux-thunk';
import { compose } from 'redux';
import { customersPaths, paths } from '../routes/paths.enum';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import AddIcon from '@material-ui/icons/Add';

interface DispatchProps {
    getCustomers(): void;
    deleteCustomer(id: string): void;
}

interface StateProps {
    customersList: any[];
    listLoadingError: string;
    listLoading: boolean;
}

const styles = (theme: Theme) => createStyles({
    fab: {
        position: "fixed",
        right: theme.spacing(2),
        bottom: parseInt(theme.mixins.toolbar.minHeight + "") + theme.spacing(2),
        transition: theme.transitions.easing.easeIn
    },
    fabIcon: {
        marginRight: theme.spacing(1)
    },
    cardPadding: {
        padding: theme.spacing(1),
        "&:last-of-type": {
            marginBottom: parseInt(theme.mixins.toolbar.minHeight + "") + theme.spacing(8)
        }
    }
})

type Props = DispatchProps & StateProps & WithStyles<typeof styles> & RouteComponentProps;

class CustomerHomePage extends Component<Props> {

    componentDidMount() {
        const { getCustomers } = this.props;
        getCustomers();
    }

    render() {
        const { customersList, listLoading, classes, deleteCustomer } = this.props;
        return (
            <>
                <Container fixed>
                    <Grid
                        container
                        direction="column"
                        justify="flex-start"
                        alignItems="stretch"
                        spacing={1}
                    >
                        {!listLoading && customersList.map(({ name, phone, _id }, key) =>
                            <Grid item xs={12} key={key} className={classes.cardPadding}>
                                < CustomerCard customerName={name} phone={phone} delete={() => deleteCustomer(_id)} />
                            </Grid>
                        )}
                    </Grid>
                </Container>
                <Fab onClick={() => this.props.history.push(paths.customer + customersPaths.createCustomer)} className={classes.fab} color="primary" variant="extended">
                    <AddIcon className={classes.fabIcon} />
                    Add Customer
                </Fab>
            </>
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


export default compose(withStyles(styles), withRouter, connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps))(CustomerHomePage) as React.ComponentType;