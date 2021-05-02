import {
    Box,
    Button,
    CircularProgress,
    Grid,
    IconButton,
    makeStyles,
    Paper as PaperBase,
    Theme,
    Tooltip,
    Typography,
    withStyles,
    Zoom,
} from "@material-ui/core";
import { EditRounded, InfoOutlined, RefreshRounded } from "@material-ui/icons";
import useAxios from "axios-hooks";
import MaterialTable, { Query, QueryResult } from "material-table";
import React, { useEffect, useRef } from "react";
import { useHistory, useParams } from "react-router";
import { BillData, PaginateResult } from "../../reducers/bill.reducer";
import { Customer } from "../../reducers/customer.reducer";
import { paths, billsPaths, customersPaths } from "../../routes/paths.enum";
import { APIResponse, axios, handleAxiosError, interpretMTQuery } from "../Axios";
import CustomerBulkPaymentReceiveStepper from "../CustomerBulkPaymentReceiveStepper";
import { tableIcons } from "../MaterialTableIcons";
import Modal from "../Modal";

interface BillAggregatedByCredit {
    _id: boolean;
    totalBillAmount: number;
    totalPaidAmount: number;
    averageBillAmount: number;
    count: number;
}

interface CustomerAggregatedData {
    byCredit: BillAggregatedByCredit[];
    totalBillAmount: number;
    totalPaidAmount: number;
    averageBillAmount: number;
}

const Paper = withStyles((theme: Theme) => ({
    root: {
        padding: theme.spacing(2),
    },
}))(PaperBase);

const TablePaper = withStyles((theme: Theme) => ({
    root: {
        padding: theme.spacing(1),
    },
}))(PaperBase);

const useStyles = makeStyles((theme: Theme) => ({
    boxRoot: {
        "&>*": {
            margin: theme.spacing(1) / 2,
        },
    },
}));

const StatPaper = ({
    title,
    billCount,
    billAmount,
    billAmountBalance,
    paidAmount,
}: {
    title: string;
    billCount: number;
    billAmount: number;
    billAmountBalance: number;
    paidAmount: number;
}) => {
    const classes = useStyles();
    return (
        <Paper elevation={0} variant="outlined">
            <Typography variant="subtitle1" color="textSecondary" style={{ fontWeight: "bold" }}>
                {title} Bills
			</Typography>
            <Box display="flex" flexDirection="row" flexWrap="wrap" className={classes.boxRoot}>
                <Box flexGrow={1}>
                    <Typography variant="subtitle2">Bill Count</Typography>
                    <Typography variant="h5">{billCount.toLocaleString()}</Typography>
                </Box>

                <Box flexGrow={1}>
                    <Typography variant="subtitle2">Total Bill Amount</Typography>
                    <Typography variant="h5">₹ {billAmount.toLocaleString()}</Typography>
                </Box>

                <Box flexGrow={1}>
                    <Typography variant="subtitle2">Total Bills Balance</Typography>
                    <Typography variant="h5">₹ {billAmountBalance.toLocaleString()}</Typography>
                </Box>

                <Box flexGrow={1}>
                    <Typography variant="subtitle2">Received Payments</Typography>
                    <Typography variant="h5">₹ {paidAmount.toLocaleString()}</Typography>
                </Box>
            </Box>
        </Paper>
    );
};

const BillsTable = () => {
    const tableRef = useRef<any>(null);
    const param = useParams<{ id: string }>();
    const history = useHistory();

    const fetchItems = (query: Query<{
        serialNumber: number;
        billAmount: number;
        paidAmount: number;
        credit: boolean;
    }>): Promise<QueryResult<BillData>> => new Promise((resolve) => {
        const url = `/bill?`;
        const search = (new URLSearchParams(Object.assign(interpretMTQuery(query), { customer: param.id }))).toString();
        axios
            .get<APIResponse<PaginateResult<BillData>>>(url + search)
            .then(function ({ data: responseData }) {
                if (responseData.data)
                    resolve({
                        data: responseData.data.docs,
                        page: responseData.data.page - 1,
                        totalCount: responseData.data.totalDocs
                    });
            })
            .catch(handleAxiosError)
    })
    return (
        <MaterialTable
            tableRef={tableRef}
            components={{
                Container: props => <TablePaper {...props} variant="outlined" />
            }}
            icons={tableIcons}
            columns={[
                { title: "Serial No.", field: "serialNumber", type: "numeric", editable: "never", align: "left" },
                { title: "Bill Amount", field: "billAmount", type: "numeric", editable: "never" },
                { title: "Paid Amount", field: "paidAmount", type: "numeric", editable: "never" },
                { title: "Balance", type: "numeric", render: (data) => data.billAmount - data.paidAmount, sorting: false },
                { title: "Status", type: "string", field: "credit", render: (data) => data.credit ? "IN CREDIT" : "CLOSED" },
            ]}
            data={(query) => fetchItems(query)}
            actions={[
                {
                    icon: () => <InfoOutlined />,
                    tooltip: 'Open Bill',
                    isFreeAction: false,
                    onClick: (_, data: any) => history.push((paths.billsHome + billsPaths.billDetail).replace(":id", data._id))
                }]}
            options={{
                exportButton: false,
                toolbarButtonAlignment: "left",
                showTitle: false,
                search: false,
                toolbar: false,
                padding: "dense",
                pageSize: 10,
                pageSizeOptions: [10, 20, 50]
            }}
        />
    )
}

export default function CustomerViewerModal() {
    const param = useParams<{ id: string }>();
    const history = useHistory();
    const [{ error, data, loading }, execute] = useAxios<
        APIResponse<Customer & CustomerAggregatedData>
    >(`/customer/${param.id}`, { manual: true });

    useEffect(() => {
        if (error) handleAxiosError(error);
    });

    useEffect(() => {
        execute();
    }, [execute])


    if (loading && !data && !error)
        return (
            <Box display="flex" alignItems="center" justifyContent="center">
                <Zoom in={loading}>
                    <CircularProgress />
                </Zoom>
            </Box>
        );
    if (data && data.data) {
        const { name, phone, place, byCredit, _id } = data.data;
        return (
            <Modal title="Customer">
                <Paper>
                    <Grid
                        container
                        direction="row"
                        justify="space-around"
                        alignItems="flex-start"
                        spacing={2}
                    >
                        <Grid item xs={12}>
                            <Paper elevation={0} variant="outlined">
                                <Grid
                                    container
                                    direction="row"
                                    justify="space-between"
                                    alignItems="flex-start"
                                    spacing={2}
                                >
                                    <Grid item xs>
                                        <Typography variant="h4">{name}
                                            <Tooltip title="Edit Customer Details">
                                                <IconButton style={{ marginLeft: "0.5rem" }} size="small" onClick={() => history.push((paths.customer + customersPaths.customerEditor).replace(":customerId", _id))}>
                                                    <EditRounded />
                                                </IconButton>
                                            </Tooltip>
                                        </Typography>
                                        <Typography
                                            variant="subtitle2"
                                            color="textSecondary"
                                            style={{ lineHeight: 1.5 }}
                                        >
                                            Location:{place} | Phone:{phone}
                                        </Typography>
                                    </Grid>
                                    <Grid item>
                                        <Typography variant="subtitle1" component="div" align="right">
                                            Total Bills:
											{byCredit
                                                .map((val) => val.count)
                                                .reduce((acc, cur) => acc + cur, 0)}
                                        </Typography>
                                        <Button
                                            variant="text"
                                            color="primary"
                                            size="small"
                                            onClick={() => execute()}
                                            startIcon={<RefreshRounded />}
                                        >
                                            Refresh
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm>
                            <BillsTable />
                        </Grid>
                        <Grid
                            xs={12}
                            sm={6}
                            md
                            item
                            container
                            alignItems="center"
                            justify="center"
                            spacing={2}
                        >
                            {byCredit.map((stat, key) => (
                                <Grid key={key} item xs={12}>
                                    <StatPaper
                                        title={stat._id ? "Credited" : "Closed"}
                                        billCount={stat.count}
                                        billAmount={stat.totalBillAmount}
                                        billAmountBalance={stat.totalBillAmount - stat.totalPaidAmount}
                                        paidAmount={stat.totalPaidAmount}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                        <Grid item xs={12} md={6} lg>
                            <CustomerBulkPaymentReceiveStepper customer={param.id} onFinish={() => execute()} />
                        </Grid>
                    </Grid>
                </Paper>
            </Modal>
        );
    } else
        return (
            <Box display="flex" alignItems="center" justifyContent="center">
                Something isn't going as expected.
                <br />
                <Zoom in={loading}>
                    <CircularProgress />
                </Zoom>
            </Box>
        );
}
