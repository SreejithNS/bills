
import {
    createStyles,
    Divider,
    Grid,
    makeStyles,
    Paper,
    Theme,
    Typography
} from "@material-ui/core";
import MaterialTable from "material-table";
import * as React from "react";
import { tableIcons } from "../MaterialTableIcons";

interface Customer {
    name: string;
    phone: number;
    place?: string;
}

interface User {
    firstName: string;
    lastName?: string;
}

interface BillItem {
    name: string;
    code: string;
    rate: number;
    mrp: number;
    quantity: number;
    amount: number;
}

export interface BillProps {
    _id?: any;
    customer: Customer;
    createdAt: string;
    soldBy: User;
    items: BillItem[];
    discountAmount: number;
    billAmount: number;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        alignRight: {
            textAlign: "right"
        },
        itemPadding: { paddingTop: theme.spacing(1) },
        paddingGrid: {
            padding: theme.spacing(2)
        },
        billFooter: {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.primary.contrastText
        },
        tablePaper: {
            padding: theme.spacing(1)
        }
    })
);

export default function BillViewer(props: BillProps) {
    const classes = useStyles();
    return (
        <Paper>
            <Grid
                container
                direction="row"
                justify="space-between"
                alignItems="center"
                className={classes.paddingGrid}
            >
                <Grid item className={classes.itemPadding} xs>
                    <Typography variant="h4" display="block">
                        {props.customer?.name || "Shop Name"}
                    </Typography>
                    <Typography variant="subtitle2" display="block">
                        Phone: {props.customer?.phone || 9489126016}
                    </Typography>
                </Grid>
                <Grid item className={classes.itemPadding + " " + classes.alignRight} xs >
                    {props.customer.place ? <Typography variant="subtitle2" display="block">
                        Place: {props.customer?.place || "Tirupattur"}
                    </Typography> : ""}
                    <Typography variant="subtitle2" display="block">
                        Date: {new Date(props?.createdAt).toString() || new Date().toString()}
                    </Typography>
                </Grid>
                <Grid item className={classes.itemPadding} xs={12}>
                    <Divider />
                </Grid>
                <Grid item xs={12} className={classes.itemPadding}>
                    <Typography variant="subtitle1" display="block">
                        Sold by: {props?.soldBy?.firstName || "Salesman"}
                    </Typography>
                </Grid>
                <Grid item className={classes.itemPadding} xs={12}>
                    <MaterialTable
                        icons={tableIcons}
                        components={{
                            Container: props => <Paper className={classes.tablePaper} {...props} variant="outlined" />
                        }}
                        columns={[
                            {
                                title: "Item",
                                field: "name",
                                editable: "never"
                            },
                            {
                                title: "Quantity",
                                field: "quantity",
                                type: "numeric",
                                editable: "always"
                            },
                            {
                                title: "Rate",
                                field: "rate",
                                type: "numeric",
                                editable: "never"
                            },
                            {
                                title: "Amount",
                                field: "amount",
                                type: "numeric",
                                editable: "never"
                            }
                        ]}
                        data={props?.items || []}
                        options={{
                            search: false,
                            paging: false,
                            toolbar: false,
                            padding: "dense"
                        }}
                    />
                </Grid>
                <Grid item xs={12} className={classes.itemPadding}>
                    <Paper className={classes.billFooter} variant="outlined">
                        <Grid
                            container
                            direction="row"
                            justify="space-between"
                            alignItems="flex-start"
                            className={classes.paddingGrid}
                        >
                            <Grid item className={classes.itemPadding} xs>
                                <Typography variant="subtitle2" display="block">
                                    Total Items: {props?.items.length || 0}
                                </Typography>
                                <Typography variant="subtitle2" display="block">
                                    Discount: {props?.discountAmount || 0}
                                </Typography>
                                <Typography variant="subtitle2" display="block">
                                    Discount (%): {props?.discountAmount ? ((props.discountAmount / (props.billAmount + props.discountAmount)) * 100).toFixed(2) : 0}%
                                </Typography>
                            </Grid>
                            <Grid item className={classes.itemPadding + " " + classes.alignRight} xs>
                                <Typography variant="subtitle2" display="block">
                                    Total Amount
                                </Typography>
                                <Typography variant="h5" display="block" >
                                    <strong>₹{props?.billAmount?.toLocaleString() || 0}</strong>
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Paper>
    );
}
