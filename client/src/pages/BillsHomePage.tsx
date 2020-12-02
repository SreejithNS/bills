import * as React from 'react'
import { CircularProgress, Container, Fab, Grid, Theme, withStyles, Zoom, WithStyles, createStyles, Typography, Button } from '@material-ui/core';
import { connect } from 'react-redux';
import { fetchBillList } from '../actions/bill.actions';
import BillCard from '../components/BillCard';
import AddIcon from '@material-ui/icons/Add';
import { compose } from 'redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { billsPaths, paths } from '../routes/paths.enum';
const Fade = require('react-reveal/Fade');
//import CustomerCard from '../components/CustomerCard';

type Props = ReturnType<typeof mapDispatchToProps> & ReturnType<typeof mapStateToProps> & WithStyles<typeof styles> & RouteComponentProps;

const styles = (theme: Theme) => createStyles({
    fab: {
        position: "sticky",
        left: theme.spacing(2),
        bottom: theme.spacing(8),
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

class BillsHomePage extends React.Component<Props> {
    componentDidMount() {
        this.props.getBillsList();
    }
    render() {
        const { billsList, billsListLoad, classes, history, billsListHasNextPage, getBillsList } = this.props;
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
                                 <Button onClick={() => history.push("/items")}>inventory</Button>
                            </Typography>
                        </Grid>
                        {(billsList.length) ? billsList.map((bill: { customer: { name: String | undefined; }; billAmount: Number | undefined; createdAt: String | undefined; _id: string; }, key: any) =>
                            <React.Fragment key={key}>
                                <Grid item xs={12} className={classes.cardPadding}>
                                    <Fade bottom>
                                        <BillCard
                                            customerName={bill.customer.name}
                                            billAmount={bill.billAmount}
                                            timestamp={bill.createdAt}
                                            deleteAction={console.log}
                                            onClickAction={() => history.push((paths.billsHome + billsPaths.billDetail).replace(":id", bill._id))}
                                        />
                                    </Fade>
                                </Grid>
                                {(key === billsList.length - 1) && billsListHasNextPage ?
                                    <Grid item xs={12} className={classes.cardPadding} style={{ textAlign: "center" }}>
                                        <Fade bottom>
                                            <Button disabled={billsListLoad} onClick={() => getBillsList(true)}>Load more bills</Button>
                                        </Fade>
                                    </Grid> : ""}
                            </React.Fragment>
                        ) : billsList.length === 0 && billsListLoad ? <Grid item xs container alignItems="center" justify="center">
                            <Typography variant="h6" align="center"><Zoom in={billsListLoad}><CircularProgress /></Zoom><br />Please wait while fetching bills</Typography>
                        </Grid>
                                : ""}
                    </Grid>
                </Container>
                <Fab onClick={() => history.push(paths.billsHome + billsPaths.addBill)} className={classes.fab} color="primary" variant="extended">
                    <AddIcon className={classes.fabIcon} />
                        New Bill
                </Fab>
            </React.Fragment >
        )
    }
}

const mapStateToProps = (state: any) => {
    return {
        billsList: state.bill.billsList,
        billsListHasNextPage: state.bill.billsListHasNextPage,
        billsListLoad: state.bill.billsListLoad
    }
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        getBillsList: (extraBills?: boolean) => dispatch(fetchBillList(extraBills))
    }
};

export default compose(withRouter, withStyles(styles), connect(mapStateToProps, mapDispatchToProps))(BillsHomePage) as React.ComponentType;