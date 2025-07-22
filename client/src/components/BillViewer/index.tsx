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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Theme,
    Tooltip,
    Typography,
    TypographyProps,
    useTheme,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box
} from "@material-ui/core";
import Add from '@material-ui/icons/Add';
import DeleteRounded from '@material-ui/icons/DeleteRounded';
import InfoOutlined from '@material-ui/icons/InfoOutlined';
import RoomRounded from '@material-ui/icons/RoomRounded';
import WhatsApp from '@material-ui/icons/WhatsApp';
import ExpandMore from '@material-ui/icons/ExpandMore';
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
        },
        gstSumarryTable: {
            width: "50%",
            float: "right",
            [theme.breakpoints.down("sm")]: {
                width: "100%",
            }
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

function GSTSummary({ data }: {
    data: BillData["gstSummary"];
}) {
    const classes = useStyles();
    return data ? (
        <TableContainer component={(props) => <Paper variant="outlined" {...props} />}>
            <Table padding="default" size="small" className={classes.gstSumarryTable}>
                <TableHead>
                    <TableRow>
                        <TableCell colSpan={3}>
                        </TableCell>
                        <TableCell align="right">
                            Taxable Amount
                        </TableCell>
                        <TableCell align="right">
                            Tax Amount
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data?.slabs.cgst.map(({ slab, totalTaxAmount, totalTaxableAmount }, key) => (
                        <TableRow key={slab}>
                            {key === 0 ? <TableCell align="center" colSpan={2} rowSpan={data?.slabs.cgst.length}>
                                CGST
                            </TableCell> : null}
                            <TableCell>
                                @{slab}%
                            </TableCell>
                            <TableCell align="right">
                                {totalTaxableAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell align="right">
                                {totalTaxAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                    ))}
                    {data?.slabs.sgst.map(({ slab, totalTaxAmount, totalTaxableAmount }, key) => (
                        <TableRow key={slab}>
                            {key === 0 ? <TableCell align="center" colSpan={2} rowSpan={data?.slabs.cgst.length}>
                                SGST
                            </TableCell> : null}
                            <TableCell>
                                @{slab}%
                            </TableCell>
                            <TableCell align="right">
                                {totalTaxableAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell align="right">
                                {totalTaxAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={2} rowSpan={6} />
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={5} rowSpan={1} />
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={2} align="right">
                            Total Taxable Amount
                        </TableCell>
                        <TableCell align="right">
                            {data?.totalTaxableAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={2} align="right">
                            Total Tax Amount (IGST)
                        </TableCell>
                        <TableCell align="right">
                            {data?.totalTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={2} align="right">
                            Total Amount (Payable)
                        </TableCell>
                        <TableCell align="right">
                            {data?.totalAmountWithTax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    ) : data;
}

export default function BillViewer(props: BillData<true> & AdditionalProps) {
    const classes = useStyles();
    const history = useHistory();
    const theme = useTheme();
    const printRef = useRef<HTMLDivElement>(null);
    const billRef = useRef<HTMLDivElement>(null);
    const userData = useSelector((state: RootState) => state.auth.userData);
    const adminData = useSelector((state: RootState) => state.auth.userData?.belongsTo);
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
                    text: `Contact us at https://wa.me/+91${adminData?.phone ?? userData?.phone}`,
                    url: `https://wa.me/+91${adminData?.phone ?? userData?.phone}`,
                    files: file ? [file] : []
                })
                    .then(() => console.log('Successful share'))
                    .catch((error: any) => console.log('Error in sharing', error));
            }
        }
    }, [props.serialNumber, userData, adminData?.phone]);

    const handleWhatsApp = useCallback(() => {
        const text = "Hi from *" + (userData?.organisation?.printTitle.replace(/\n/g, " ") ?? "") + "*" +
            "\nYour bill amount is * " + props.billAmount.toINR() + "*." +
            "\nThank you." +
            "\n\nPowered by BillzApp.in";
        const uri = `https://wa.me/91${props.customer.phone}?text=${encodeURIComponent(text)}`;
        //const url = `${encodeURIComponent(`Bill#${props.serialNumber} ${userData ? "shared by " + userData.name : ""} ${window.location.origin + paths.billsHome + billsPaths.billDetail.replace(":id", props._id) + `#from=${userData?._id ?? ""}`}`)}`
        window.open(uri);
    }, [props.billAmount, props.customer.phone, userData?.organisation?.printTitle]);
    return (<>
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
                        style={{ verticalAlign: 'top' }}
                        columns={[
                            {
                                title: "Item",
                                field: "name",
                                editable: "never"
                            },
                            {
                                title: "HSN Code",
                                field: "hsn",
                                type: "string",
                                hidden: props.gstSummary === null,
                                editable: "never",
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
                                editable: "never",
                                hidden: props.gstSummary !== null,
                            },
                            {
                                title: "Amount",
                                field: "amount",
                                type: "numeric",
                                editable: "never",
                                render: (rowData: { quantity: number; rate: number; taxableAmount: any; }) => {
                                    return parseFloat((props.gstSummary === null
                                        ? rowData.quantity * rowData.rate
                                        : rowData.taxableAmount).toFixed(2));
                                }
                            },
                            ...(props.gstSummary === null ? [] : [
                                {
                                    title: "GST",
                                    field: "cgst",
                                    type: "numeric",
                                    editable: "never",
                                    render: (rowData: any) => <>
                                        <Box component="div">
                                            {rowData.taxAmount}
                                        </Box>
                                        ({rowData.cgst + rowData.sgst + "%"})
                                        <Box component="div" display="none" fontSize={12} fontWeight="bold" color="grey">
                                            @CGST {rowData.cgst}%<br />
                                            @SGST {rowData.sgst}%<br />
                                        </Box>
                                    </>
                                },
                                {
                                    title: "Tax Amount",
                                    field: "taxAmount",
                                    hidden: true,
                                    type: "numeric",
                                    editable: "never",
                                    render: (rowData: { taxAmount: { toLocaleString: (arg0: string) => string; }; }) => "" + rowData.taxAmount.toLocaleString("en-IN")
                                },
                                {
                                    title: "Total",
                                    type: "numeric",
                                    editable: "never",
                                    render: (rowData: { taxableAmount: any; taxAmount: any; }) => "" + (rowData.taxableAmount + rowData.taxAmount).toLocaleString("en-IN")
                                },
                            ] as any)]}
                        data={props?.items || [] as BillData<typeof props.gstSummary>[]}
                        options={{
                            search: false,
                            paging: false,
                            toolbar: false,
                            padding: "dense"
                        }}
                    />
                </Grid>
                {props.gstSummary !== null
                    ? <Grid item className={classes.itemPadding} xs={12}>
                        <Accordion variant="outlined">
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                            >
                                <Typography>
                                    GST Summary
                            </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <GSTSummary data={props.gstSummary} />
                            </AccordionDetails>
                        </Accordion>
                    </Grid>
                    : null
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
                                <Typography variant="caption" display="block" >
                                    {props?.paymentMode.toUpperCase() || ""}
                                </Typography>
                                {(props.credit && billUpdatePermission) && <Button variant="outlined" onClick={props.receivePayment} className={classes.button} size="small" startIcon={<Add />}>Receive Payment</Button>}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
            {available &&
                <QRDialog
                    content={uri}
                    open={qrDialogOpen}
                    onClose={() => setQrDialogOpen(false)}
                    footer={<span style={theme.typography.h6}>Scan to Pay<br /><strong> {props.billAmount.toINR()}</strong></span>}
                />
            }
        </Paper >
        
        <PlainPrint bill={props} ref={printRef} />
        </>
    );
}

/**
 *
 */
