import {
    Avatar,
    Button,
    Chip,
    createStyles,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    makeStyles,
    Paper,
    Theme,
    Tooltip,
    Typography,
    TypographyProps,
    useTheme
} from "@material-ui/core";
import { Add, DeleteRounded, InfoOutlined, RoomRounded, WhatsApp } from "@material-ui/icons";
import MaterialTable from "material-table";
import * as React from "react";
import { useCallback, useRef } from "react";
import { tableIcons } from "../MaterialTableIcons";
import PaymentsList from "../PaymentsList";
import moment from "moment";
import { BillData } from "../../reducers/bill.reducer";
import { useHistory } from "react-router";
import { billsPaths, customersPaths, paths } from "../../routes/paths.enum";
import Print from "../Print";
import { toast } from "react-toastify";
import PrintIcon from '@material-ui/icons/Print';
import WirelessPrint from '@material-ui/icons/SettingsRemote';
import PlainPrint from "../Print/PlainPrint";
import { useReactToPrint } from "react-to-print";
import ShareIcon from '@material-ui/icons/Share';
import { useSelector } from "react-redux";
import { RootState } from "../../reducers/rootReducer";
import { useHasPermission } from "../../actions/auth.actions";
import { UserPermissions } from "../../reducers/auth.reducer";
import { toBlob } from "html-to-image";
import QRCode from 'qrcode';
import { useUPI } from "../UPI/hooks";
import { UPIIconButton } from "../UPI/UPIIcon";

const QRDialog = ({ open, onClose, content, title = "Scan the QR Code", footer = "" }: { open: boolean, onClose: () => void, title?: string, content: string, footer?: string | TypographyProps["children"] }) => {
    const [src, setSrc] = React.useState<string>("");
    React.useEffect(() => {
        QRCode.toDataURL(content).then(url => {
            setSrc(url);
        });
    }, [content]);
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent style={{ textAlign: "center" }}>
                <img src={src} alt="qr" />
                <Typography variant="body2" display="block">{footer}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">Close</Button>
            </DialogActions>
        </Dialog>
    );
}


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
            marginTop: theme.spacing(1),
        }
    })
);

interface AdditionalProps {
    receivePayment(): void;
    payBalance(balance?: number): void;
    creditAction(): void;
    onDelete?(): void;
    paymentDelete?(id: string): void;
}

export default function BillViewer(props: BillData & AdditionalProps) {
    const classes = useStyles();
    const history = useHistory();
    const theme = useTheme();
    const printRef = useRef<HTMLDivElement>(null);
    const billRef = useRef<HTMLDivElement>(null);
    const userData = useSelector((state: RootState) => state.auth.userData);
    const [qrDialogOpen, setQrDialogOpen] = React.useState(false);
    const { available, uri } = useUPI({
        billId: props._id,
        amount: props.billAmount,
    });

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
    });
    const billUpdatePermission = useHasPermission(UserPermissions.ALLOW_BILL_PUT);
    const billDeletePermission = useHasPermission(UserPermissions.ALLOW_BILL_DELETE);

    const print = useCallback(() => {
        Print.onDisconnect = () => toast.warn("Printer Disconnected")
        Print.init().then(instance => {
            return instance.printBill(props)
        }).then(() => toast.success("Bill Printed!")).catch((error) => toast.error(error.message));

        return async () => {
            await Print.disconnect()
        }
    }, [props]);

    const handleShare = useCallback(async () => {
        if (printRef.current) {
            const display = { ...printRef.current.style };
            printRef.current.style.display = "block";
            printRef.current.style.visibility = "visible";
            const blob = await toBlob(printRef.current, {
            });
            const file = blob ? new File([blob], 'bill.png', { type: blob.type }) : null;

            printRef.current.style.display = display.display;
            printRef.current.style.visibility = display.visibility;
            if (navigator.share) {
                await navigator.share({
                    title: `BillzApp | Bill#${props.serialNumber}`,
                    text: `BillzApp | Bill#${props.serialNumber} ${userData ? "shared by " + userData.name : ""}`,
                    url: window.location.origin + paths.billsHome + billsPaths.billDetail.replace(":id", props._id) + `#from=${userData?._id ?? ""}`,
                    files: file ? [file] : []
                })
                    .then(() => console.log('Successful share'))
                    .catch((error) => console.log('Error in sharing', error));
            }
        }
    }, [props, userData, printRef]);

    const handleWhatsApp = useCallback(() => {
        const text = "Hi from *" + (userData?.organisation?.printTitle.replace(/\n/g, " ") ?? "") + "*" +
            "\nYour bill amount is *₹ " + props.billAmount.toLocaleString() + "*." +
            "\nThank you." +
            "\n\nPowered by BillzApp.in";
        const uri = `https://wa.me/91${props.customer.phone}?text=${encodeURIComponent(text)}`;
        //const url = `${encodeURIComponent(`Bill#${props.serialNumber} ${userData ? "shared by " + userData.name : ""} ${window.location.origin + paths.billsHome + billsPaths.billDetail.replace(":id", props._id) + `#from=${userData?._id ?? ""}`}`)}`
        window.open(uri);
    }, [props.billAmount, props.customer.phone, userData?.organisation?.printTitle]);

    return (
        <Paper ref={billRef}>
            <Grid
                container
                direction="row"
                justify="space-between"
                alignItems="center"
                className={classes.paddingGrid + " " + classes.printHide}
            >
                <Grid item className={classes.itemPadding} xs>
                    <Typography variant="h4">
                        {props.customer?.name || "Shop Name"}
                        <Tooltip title="View Customer Details">
                            <IconButton onClick={() => history.push((paths.customer + customersPaths.customerViewer).replace(":id", props.customer._id))}>
                                <InfoOutlined />
                            </IconButton>
                        </Tooltip>
                    </Typography>
                    <Typography variant="subtitle1" display="block">
                        Bill: #{props.serialNumber || "Serial Number Error"}
                    </Typography>
                </Grid>
                <Grid item className={classes.itemPadding + " " + classes.alignRight} xs >
                    {props.customer.place ? <Typography variant="subtitle2" display="block">
                        Place: {props.customer?.place || "Tirupattur"}
                    </Typography> : ""}
                    <Typography variant="subtitle2" display="block">
                        Date: {moment(props?.createdAt).format('MMM D YYYY, h:mm a') || moment().format('MMM D YYYY, h:mm a')}
                    </Typography>
                    {props.location && <Tooltip title="Open Location in Google Maps">
                        <IconButton onClick={() => { window.open(`https://www.google.com/maps/search/?api=1&query=${props.location?.coordinates.reverse().join(",")}`) }}>
                            <RoomRounded />
                        </IconButton>
                    </Tooltip>}
                    <Tooltip title="Print via Bluetooth">
                        <IconButton onClick={() => print()}>
                            <WirelessPrint />
                        </IconButton>
                    </Tooltip>
                    {handlePrint ? <Tooltip title="Print">
                        <IconButton onClick={() => handlePrint()}>
                            <PrintIcon />
                        </IconButton>
                    </Tooltip> : <></>}
                    <Tooltip title="Share this Bill">
                        <IconButton onClick={handleShare}>
                            <ShareIcon />
                        </IconButton>
                    </Tooltip>
                    {
                        props.customer.phone && <Tooltip title="Send Bill to Customer via WhatsApp">
                            <IconButton onClick={handleWhatsApp}>
                                <WhatsApp />
                            </IconButton>
                        </Tooltip>
                    }
                    {available &&
                        <Tooltip title="Show UPI QR">
                            <UPIIconButton onClick={() => setQrDialogOpen(true)} style={{ color: theme.palette.text.secondary }} />
                        </Tooltip>
                    }
                    {(billDeletePermission && props.onDelete) && <Tooltip title="Delete Bill">
                        <IconButton color="secondary" onClick={() => props.onDelete && props.onDelete()}>
                            <DeleteRounded />
                        </IconButton>
                    </Tooltip>}
                </Grid>
                <Grid item className={classes.itemPadding} xs={12}>
                    <Divider />
                </Grid>
                <Grid item xs={12} className={classes.itemPadding}>
                    <Typography variant="subtitle1" display="block">
                        Sold by: {props?.soldBy?.name || "Salesman"}
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
                                title: "Rate",
                                field: "rate",
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
                                    Total Amount: ₹ {props?.items.map(item => item.rate * item.quantity).reduce((acc, cur) => acc + cur, 0).toLocaleString() ?? 0}
                                </Typography>
                                <Typography variant="subtitle2" display="block">
                                    Discount: ₹ {props?.discountAmount.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="subtitle2" display="block">
                                    Discount (%): {props?.discountAmount ? ((props.discountAmount / (props.billAmount + props.discountAmount)) * 100).toFixed(2) : 0}%
                                </Typography>
                                <Typography variant="subtitle2" display="block">
                                    Balance: ₹ {(props.billAmount - props.paidAmount).toLocaleString()}
                                </Typography>
                                {billUpdatePermission && (props.credit === null || props.credit === undefined)
                                    ? <></>
                                    : !props.credit
                                        ? <Chip color="primary" onClick={props.creditAction} variant="outlined" style={{ color: "white" }} size="small" avatar={<Avatar>₹</Avatar>} label="Bill Closed" />
                                        : <Chip color="primary" size="small" onClick={props.creditAction} avatar={<Avatar>₹</Avatar>} label="In Credit" />
                                }
                            </Grid>
                            <Grid item className={classes.itemPadding + " " + classes.alignRight} xs>
                                <Typography variant="subtitle1" display="block">
                                    Bill Amount
                                </Typography>
                                <Typography variant="h4" display="block" >
                                    <strong>₹{props?.billAmount?.toLocaleString() || 0}</strong>
                                </Typography>
                                <Typography variant="subtitle2" display="block">
                                    Paid Amount
                                </Typography>
                                <Typography variant="h5" display="block" >
                                    <strong>₹{props?.paidAmount?.toLocaleString() || 0}</strong>
                                </Typography>
                                {(props.credit && billUpdatePermission) && <Button variant="outlined" onClick={props.receivePayment} className={classes.button} size="small" startIcon={<Add />}>Receive Payment</Button>}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
            <PlainPrint bill={props} ref={printRef} />
            {available &&
                <QRDialog
                    content={uri}
                    open={qrDialogOpen}
                    onClose={() => setQrDialogOpen(false)}
                    footer={<span style={theme.typography.h6}>Scan to Pay<br /><strong>₹ {(props.billAmount - props.paidAmount).toLocaleString()}</strong></span>}
                />
            }
        </Paper >
    );
}
