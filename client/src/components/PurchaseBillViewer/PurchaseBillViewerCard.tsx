import {
    Avatar,
    Button,
    Chip,
    createStyles,
    Divider,
    Grid,
    IconButton,
    makeStyles,
    Paper,
    Theme,
    Tooltip,
    Typography
} from "@material-ui/core";
import { Add, DeleteRounded, InfoOutlined, RoomRounded } from "@material-ui/icons";
import MaterialTable from "material-table";
import * as React from "react";
import { useRef } from "react";
import { tableIcons } from "../MaterialTableIcons";
import PaymentsList from "../PaymentsList";
import moment from "moment";
import { PurchaseBillData as BillData, PurchaseBillItem } from "../../reducers/purchasebill.reducer";
import { useHistory } from "react-router";
import { billsPaths, customersPaths, paths } from "../../routes/paths.enum";
import PrintIcon from '@material-ui/icons/Print';
import { useReactToPrint } from "react-to-print";
import { WhatsappShareButton } from 'react-share';
import WhatsAppIcon from '@material-ui/icons/WhatsApp';
import { useSelector } from "react-redux";
import { RootState } from "../../reducers/rootReducer";
import { useHasPermission } from "../../actions/auth.actions";
import { UserPermissions } from "../../reducers/auth.reducer";
import SalesHistory from "./SalesHistory";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        printHide: {
            "@media print": {
                display: "none"
            }
        },
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
        },
        button: {
            color: theme.palette.common.white,
            borderColor: theme.palette.common.white,
            fontWeight: theme.typography.fontWeightBold,
            marginTop: theme.spacing(1),
        }
    })
);

interface AdditionalProps {
    items: PurchaseBillItem[];
    receivePayment(): void;
    payBalance(balance?: number): void;
    creditAction(): void;
    deleteSales?: (id: string) => void;
    onDelete?(id: string): void;
    paymentDelete?(id: string): void;
}

export default function PurchaseBillViewer(props: BillData & AdditionalProps) {
    const classes = useStyles();
    const history = useHistory();
    const printRef = useRef<HTMLDivElement>(null);
    const userData = useSelector((state: RootState) => state.auth.userData);
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
    });
    const billUpdatePermission = useHasPermission(UserPermissions.ALLOW_BILL_PUT);
    const billDeletePermission = useHasPermission(UserPermissions.ALLOW_BILL_DELETE);

    return (
        <Paper>
            <Grid
                container
                direction="row"
                justify="space-between"
                alignItems="center"
                className={classes.paddingGrid + " " + classes.printHide}
            >
                <Grid item className={classes.itemPadding} xs>
                    <Typography variant="h4">
                        {props.contact?.name || "Shop Name"}
                        <Tooltip title="View Customer Details">
                            <IconButton onClick={() => history.push((paths.customer + customersPaths.customerViewer).replace(":id", props.contact._id))}>
                                <InfoOutlined />
                            </IconButton>
                        </Tooltip>
                    </Typography>
                    <Typography variant="subtitle1" display="block">
                        Bill: #{props.serialNumber || "Serial Number Error"}
                    </Typography>
                </Grid>
                <Grid item className={classes.itemPadding + " " + classes.alignRight} xs >
                    {props.contact.place ? <Typography variant="subtitle2" display="block">
                        Place: {props.contact?.place || "Tirupattur"}
                    </Typography> : ""}
                    <Typography variant="subtitle2" display="block">
                        Date: {moment(props?.createdAt).format('MMM D YYYY, h:mm a') || moment().format('MMM D YYYY, h:mm a')}
                    </Typography>
                    {props.location && <Tooltip title="Open Location in Google Maps">
                        <IconButton onClick={() => { window.open(`https://www.google.com/maps/search/?api=1&query=${props.location?.coordinates.join(",")}`) }}>
                            <RoomRounded />
                        </IconButton>
                    </Tooltip>}
                    {handlePrint ? <Tooltip title="Print">
                        <IconButton onClick={() => handlePrint()}>
                            <PrintIcon />
                        </IconButton>
                    </Tooltip> : <></>}
                    <Tooltip title="Share on WhatsApp">
                        <WhatsappShareButton title={`BillzApp | Bill#${props.serialNumber} ${userData ? "shared by " + userData.name : ""}`} url={window.location.origin + paths.billsHome + billsPaths.billDetail.replace(":id", props._id) + `#from=${userData?._id ?? ""}`} >
                            <IconButton>
                                <WhatsAppIcon />
                            </IconButton>
                        </WhatsappShareButton>
                    </Tooltip>
                    {(billDeletePermission && props.onDelete) && <Tooltip title="Delete Bill">
                        <IconButton color="secondary" onClick={() => props.onDelete && props.onDelete(props._id)}>
                            <DeleteRounded />
                        </IconButton>
                    </Tooltip>}
                </Grid>
                <Grid item className={classes.itemPadding} xs={12}>
                    <Divider />
                </Grid>
                <Grid item xs={12} className={classes.itemPadding}>
                    <Typography variant="subtitle1" display="block">
                        Purchased by: {props?.soldBy?.name || "Salesman"}
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
                                editable: "always",
                                render: (rowData: any) => <><strong>{rowData.quantity}</strong> {rowData.unit?.length ? rowData.unit.split(" ").map((c: string) => c.charAt(0)).join("").toUpperCase() : ""}</>
                            },
                            {
                                title: "In-Stock",
                                field: "instock",
                                type: "numeric",
                                editable: "never"
                            },
                            {
                                title: "Cost",
                                field: "cost",
                                type: "numeric",
                                editable: "never"
                            },
                            {
                                title: "Amount",
                                field: "amount",
                                type: "numeric",
                                editable: "never",
                                render: rowData => rowData.quantity * rowData.rate
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
                {(props.sales.length > 0) &&
                    <Grid item className={classes.itemPadding} xs={12}>
                        <SalesHistory sales={props.sales} onOpen={(id) => history.push(paths.billsHome + billsPaths.billDetail.replace(":id", id))} onDelete={(id) => props.deleteSales && props.deleteSales(id)} />
                    </Grid>
                }
                {(props.payments && props.payments.length)
                    ? <Grid item className={classes.itemPadding} xs={12}>
                        <PaymentsList payments={props.payments} onDelete={props.paymentDelete} />
                    </Grid>
                    : <></>
                }
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
                                    Total Amount:  {props?.items.map(item => item.rate * item.quantity).reduce((acc, cur) => acc + cur, 0).toINR() ?? 0}
                                </Typography>
                                <Typography variant="subtitle2" display="block">
                                    Discount:  {props?.discountAmount.toINR() || 0}
                                </Typography>
                                <Typography variant="subtitle2" display="block">
                                    Discount (%): {props?.discountAmount ? ((props.discountAmount / (props.billAmount + props.discountAmount)) * 100).toFixed(2) : 0}%
                                </Typography>
                                <Typography variant="subtitle2" display="block">
                                    Balance:  {(props.billAmount - props.paidAmount).toINR()}
                                </Typography>
                                {billUpdatePermission && (props.credit === null || props.credit === undefined)
                                    ? <></>
                                    : !props.credit
                                        ? <Chip color="primary" onClick={props.creditAction} variant="outlined" style={{ color: "white" }} size="small" avatar={<Avatar></Avatar>} label="Bill Closed" />
                                        : <Chip color="primary" size="small" onClick={props.creditAction} avatar={<Avatar></Avatar>} label="In Credit" />
                                }
                            </Grid>
                            <Grid item className={classes.itemPadding + " " + classes.alignRight} xs>
                                <Typography variant="subtitle1" display="block">
                                    Bill Amount
                                </Typography>
                                <Typography variant="h4" display="block" >
                                    <strong>{props?.billAmount?.toINR() || 0}</strong>
                                </Typography>
                                <Typography variant="subtitle2" display="block">
                                    Paid Amount
                                </Typography>
                                <Typography variant="h5" display="block" >
                                    <strong>{props?.paidAmount?.toINR() || 0}</strong>
                                </Typography>
                                {(props.credit && billUpdatePermission) && <Button variant="outlined" onClick={props.receivePayment} className={classes.button} size="small" startIcon={<Add />}>Receive Payment</Button>}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Paper >
    );
}
