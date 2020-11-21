import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import { TransitionProps } from '@material-ui/core/transitions';
import { Container } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import BillViewer, { BillProps } from '../BillViewer';
import { useDispatch, useSelector } from 'react-redux';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
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
    }),
);

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

type RootState = {
    bill: {
        billData: BillProps;
    }
}

export default function BillViewerModal() {
    const classes = useStyles();
    const history = useHistory();
    const params = useParams<{ id?: string }>();
    const billData = useSelector((state: RootState) => state.bill.billData)
    const dispatch = useDispatch();
    console.log(params);
    const bill: BillProps = {
        createdAt: new Date(),
        customer: {
            name: "Customer Name",
            phone: 9489126016,
            place: "Tirupattur"
        },
        items: [
            {
                code: "MAGGIE",
                mrp: 10,
                name: "Maggie Noodles",
                quantity: 10,
                rate: 10,
                amount: 100
            }
        ],
        soldBy: {
            firstName: "Test User"
        },
        billAmount: 123456.255,
        discountAmount: 20
    }
    console.log(dispatch(params.id && ""), billData)//fetchBill(params.id)))

    return (
        <Dialog fullScreen open={true} onClose={history.goBack} TransitionComponent={Transition}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={history.goBack} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" className={classes.title}>
                        Bill
                    </Typography>
                    <Button autoFocus color="inherit" onClick={history.goBack}>
                        Close
                    </Button>
                </Toolbar>
            </AppBar>
            <Container fixed className={classes.containerPadding}>
                <BillViewer
                    createdAt={bill.createdAt}
                    customer={bill.customer}
                    items={bill.items}
                    soldBy={bill.soldBy}
                    billAmount={bill.billAmount}
                    discountAmount={bill.discountAmount}
                />
            </Container>
        </Dialog>
    );
}
