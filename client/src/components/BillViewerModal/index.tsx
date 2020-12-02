import React from 'react';
import { createStyles, Theme, WithStyles, withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import { TransitionProps } from '@material-ui/core/transitions';
import { CircularProgress, Container, Zoom } from '@material-ui/core';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import BillViewer from '../BillViewer';
import { connect } from 'react-redux';
import { fetchbill, putBillCredit } from "../../actions/bill.actions";
import { compose } from 'redux';
import { paths } from '../../routes/paths.enum';
import PaymentReceiveDialog from '../PaymentReceiveDialog';

const styles = (theme: Theme) => createStyles({
    appBar: {
        position: 'relative',
    },
    title: {
        marginLeft: theme.spacing(2),
        flex: 1,
    },
    containerPadding: {
        padding: theme.spacing(2)
    }
});

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

type Props = ReturnType<typeof mapStatetoProps> & ReturnType<typeof mapDispatchToProps> & WithStyles<typeof styles> & RouteComponentProps<{ id: string }>


class BillViewerModal extends React.Component<Props> {
    state = {
        modalOpen: true,
        dialogOpen: false
    }
    componentDidMount() {
        const { getBill, match, history } = this.props;
        getBill(match.params.id, () => history.push(paths.billsHome));
    }

    handleCreditUpdate = () => {
        var confirmation = window.confirm(this.props.bill?.credit ? "Do you want to close this bill and stop receiving payments for this bill?" : "Do you want to credit this bill and accept more payments?");
        if (confirmation) this.props.toggleCredit(this.props.match.params.id);
    }

    setOpen = (value: boolean) => this.setState({ modalOpen: value })
    render() {
        const { bill, billDataLoad, classes, history } = this.props;
        const { modalOpen } = this.state;
        const { setOpen } = this;
        return (
            <>
                <Dialog fullScreen open={modalOpen} onClose={() => { setOpen(false); history.goBack() }} TransitionComponent={Transition}>
                    <AppBar className={classes.appBar}>
                        <Toolbar>
                            <IconButton edge="start" color="inherit" onClick={() => { setOpen(false); history.goBack() }} aria-label="close">
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" className={classes.title}>
                                Bill
                    </Typography>
                            <Button autoFocus color="inherit" onClick={() => { setOpen(false); history.goBack() }}>
                                Close
                    </Button>
                        </Toolbar>
                    </AppBar>
                    <Container fixed className={classes.containerPadding}>
                        {billDataLoad || (Object.keys(bill).length < 1) ?
                            <Zoom in={billDataLoad}><CircularProgress /></Zoom>
                            : <BillViewer
                                receivePayment={() => this.setState({ dialogOpen: true })}
                                createdAt={bill.createdAt}
                                customer={bill.customer}
                                items={bill.items}
                                soldBy={bill.soldBy}
                                billAmount={bill.billAmount}
                                discountAmount={bill.discountAmount}
                                payments={bill.payments || []}
                                credit={bill.credit}
                                paidAmount={bill.paidAmount}
                                creditAction={this.handleCreditUpdate}
                            />}
                    </Container>
                </Dialog>
                <PaymentReceiveDialog open={this.state.dialogOpen} billId={this.props.match.params.id} onClose={() => this.setState({ dialogOpen: false })} />
            </>
        );
    }
}
const mapStatetoProps = (state: { bill: { billData: any; billDataLoad: any; }; }) => ({
    bill: state.bill.billData,
    billDataLoad: state.bill.billDataLoad
});

const mapDispatchToProps = (dispatch: any) => ({
    getBill: (id: string, fallBack: any) => dispatch(fetchbill(id, fallBack)),
    toggleCredit: (id: string) => dispatch(putBillCredit(id))
})

export default compose<React.ComponentType>(
    withRouter,
    withStyles(styles),
    connect(mapStatetoProps, mapDispatchToProps),
)(BillViewerModal);