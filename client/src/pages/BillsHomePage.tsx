import React, { Component } from 'react';
import { CircularProgress, Container, Fab, Grid, Zoom, Theme, withStyles, WithStyles, createStyles, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import { fetchBillList } from '../actions/bill.actions';
import BillCard from '../components/BillCard';
import AddIcon from '@material-ui/icons/Add';
//import CustomerCard from '../components/CustomerCard';

type Props = ReturnType<typeof mapDispatchToProps> & ReturnType<typeof mapStateToProps> & WithStyles<typeof styles>;

const styles = (theme: Theme) => createStyles({
    fab: {
        position: "fixed",
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
    fabIcon: {
        marginRight: theme.spacing(1)
    },
    cardPadding: {
        padding: theme.spacing(1),
        "&:last-of-type": {
            marginBottom: theme.spacing(8)
        }
    }
})

class BillsHomePage extends Component<Props> {
    render() {
        const { billsList, billsListLoad, classes } = this.props;
        return (
            <React.Fragment>
                <Container fixed>
                    <Grid
                        container
                        justify="center"
                        alignItems="flex-start"
                        spacing={2}
                    >
                        <Grid item xs={12}>
                            <Typography variant="h4">
                                Your Bills
                            </Typography>
                        </Grid>
                        {!billsListLoad ? billsList.map((bill: { customer: { name: String | undefined; }; billAmount: Number | undefined; key: string | number | null | undefined; createdAt: String | undefined; }, key: any) =>
                            <Grid item key={key} xs={12} className={classes.cardPadding}>
                                <BillCard
                                    customerName={bill.customer.name}
                                    billAmount={bill.billAmount}
                                    timestamp={bill.createdAt}
                                    deleteAction={console.log}
                                />
                            </Grid>
                        ) : <Grid item xs container alignItems="center" justify="center">
                                <Typography variant="h6" align="center"><Zoom in={billsListLoad}><CircularProgress /></Zoom><br />Please wait while fetching bills</Typography>
                            </Grid>
                        }
                    </Grid>
                </Container>
                <Fab className={classes.fab} color="primary" variant="extended">
                    <AddIcon className={classes.fabIcon} />
                        New Bill
                </Fab>
            </React.Fragment>
        )
    }
}

const mapStateToProps = (state: any) => {
    return {
        billsList: state.bill.billsList,
        billsListLoad: state.bill.billsListLoad
    }
};

const mapDispatchToProps = (dispatch: any) => {
    return { getBillsList: dispatch(fetchBillList()) }
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(BillsHomePage));