import * as React from 'react'
import { CircularProgress, Fab, Grid, Theme, Zoom, Typography, Button, makeStyles, Box, Card, CardContent, Tooltip } from '@material-ui/core';
import BillCard from '../components/BillCard';
import ParagraphIconCard from "../components/ParagraphIconCard";
import AddIcon from '@material-ui/icons/Add';
import { useHistory } from 'react-router-dom';
import { billsPaths, paths } from '../routes/paths.enum';
import { LineWeightRounded } from '@material-ui/icons';
import BillSearch from '../components/BillSearch';
import PageContainer from '../components/PageContainer';
import { useCallback, useEffect, useState } from 'react';
import useAxios from 'axios-hooks';
import { APIResponse, axios, handleAxiosError } from '../components/Axios';
import { BillData, PaginateResult } from '../reducers/bill.reducer';
import { toast } from 'react-toastify';
import { useConfirm } from 'material-ui-confirm';
import moment from 'moment';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import TollIcon from '@material-ui/icons/Toll';
import { useQueryStringKey } from 'use-route-as-state';
const Fade = require('react-reveal/Fade');

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        minWidth: theme.breakpoints.width("xs")
    },
    content: {
        "&:last-child": {
            paddingBottom: theme.spacing(2)
        }
    },
    fab: {
        position: "fixed",
        right: theme.spacing(2),
        bottom: parseInt(theme.mixins.toolbar.minHeight + "") + theme.spacing(2),
    },
    fabIcon: {
        marginRight: theme.spacing(1)
    },
    cardPadding: {
        padding: theme.spacing(1)
    },
    redText: {
        color: theme.palette.error.main
    },
    greenText: {
        color: theme.palette.success.main
    },
    boxRoot: {
        "&>*": {
            margin: theme.spacing(1) / 2,
        },
    },
}))

const StatPaper = ({
    title,
    billDiscounts,
    billAmount,
    billAmountBalance,
    paidAmount,
}: {
    title: string;
    billDiscounts: number;
    billAmount: number;
    billAmountBalance: number;
    paidAmount: number;
}) => {
    const classes = useStyles();
    return (
        <Card className={classes.root} variant="outlined" >
            <CardContent className={classes.content}>
                <Typography variant="subtitle1" color="textSecondary" style={{ fontWeight: "bold" }}>
                    {title}
                </Typography>
                <Box display="flex" flexDirection="row" flexWrap="wrap" className={classes.boxRoot}>
                    <Tooltip title={`Without Discount ₹${(billDiscounts + billAmount).toLocaleString()}`}>
                        <Box flexGrow={1}>
                            <Typography variant="subtitle2">Total Bill Amount</Typography>
                            <Typography variant="h5">₹ {billAmount.toLocaleString()}</Typography>
                        </Box>
                    </Tooltip>


                    <Box flexGrow={1}>
                        <Typography variant="subtitle2">Total Bill Discount</Typography>
                        <Typography variant="h5">₹ {billDiscounts.toLocaleString()}</Typography>
                    </Box>

                    <Box flexGrow={1}>
                        <Typography variant="subtitle2">Total Bills Balance</Typography>
                        <Typography variant="h5">₹ {billAmountBalance.toLocaleString()}</Typography>
                    </Box>

                    <Box flexGrow={1}>
                        <Typography variant="subtitle2">Total Received Payments</Typography>
                        <Typography variant="h5">₹ {paidAmount.toLocaleString()}</Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default function BillsHomePage() {
    const [sortParam, setSortParam] = useQueryStringKey("sortParam", "createdAt");
    const [sortDirection, setSortDirection] = useQueryStringKey("sortDirection", "desc");
    const [pageNumber, setPageNumber] = useQueryStringKey("page", "1");
    const [limit, setLimit] = useQueryStringKey("limit", "10");
    const [searchParam, setSearchParam] = useQueryStringKey("searchParam", "customer");
    const [searchValue, setSearchValue] = useQueryStringKey("searchValue");
    const [selectedFromDate, setSelectedFromDate] = useQueryStringKey("fromDate");
    const [selectedToDate, setSelectedToDate] = useQueryStringKey("toDate");
    const [creditFilter, setCreditFilter] = useQueryStringKey("credit");
    const [showAll, setShowAll] = useQueryStringKey("showAll");
    const [requestLoading, setRequestLoading] = useState(false);

    type ResponseData = APIResponse<PaginateResult<BillData>>;

    const [{ loading: getLoading, error, data }, execute] = useAxios<ResponseData>({
        url: "/bill",
        params: {
            page: pageNumber,
            limit,
            sort: (sortDirection === "desc" ? "-" : "") + sortParam,
            ...((searchParam && searchValue) && { [searchParam]: searchValue }),
            ...(selectedFromDate && { "startDate": selectedFromDate }),
            ...(selectedToDate && { "endDate": selectedToDate }),
            ...(creditFilter && { credit: creditFilter === "1" })
        }
    }, { manual: true })

    useEffect(() => {
        execute();
    }, [execute])

    const confirm = useConfirm();
    const deleteBill = useCallback(
        (billId: BillData["_id"]) => {
            confirm({
                title: "Are you sure?",
                description: "Deleting a bill is not undoable. You cannot recover the bill data once deleted.",
                confirmationText: "Delete",
                confirmationButtonProps: {
                    color: "secondary"
                }
            }).then(() => {
                setRequestLoading(true);
                return axios.delete("/bill/id/" + billId).catch(() => toast.info("Bill did not delete."));
            }).then(
                () => { toast.success("Bill deleted successfully"); execute() },
                handleAxiosError
            ).finally(() => setRequestLoading(false))
            //eslint-disable-next-line
        }, [data]
    )

    const loading = getLoading || requestLoading;

    const history = useHistory();
    const classes = useStyles();

    if (error) toast.error("Could get bills list");

    useEffect(() => {
        if (showAll === "true") {
            if (!loading && data?.data?.totalDocs)
                if (data.data.totalDocs <= 150) {
                    setLimit(data?.data?.totalDocs.toString() ?? "10")
                } else {
                    toast.warn("Show all not possible. Adjust your filter so that you bills count comes under 150.")
                }
        } else if (showAll === "false") setLimit("10")
        //eslint-disable-next-line
    }, [showAll, loading])

    return (
        <React.Fragment>
            <PageContainer>
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
                    <Grid item xs={12}>
                        <BillSearch
                            showAll={showAll === "true"}
                            onShowAllChange={(value) => setShowAll(value.toString())}
                            creditFilter={creditFilter ?? ""}
                            onCreditFilterChange={setCreditFilter}
                            selectedToDate={selectedToDate || null}
                            selectedFromDate={selectedFromDate || null}
                            onSelectedToDateChange={(value) => setSelectedToDate(value ?? "")}
                            onSelectedFromDateChange={(value) => setSelectedFromDate(value ?? "")}
                            searchParam={searchParam}
                            onPageSizeChange={(number) => setLimit((number || 1).toString())}
                            onSearchParamChange={setSearchParam}
                            onSearchValueChange={setSearchValue}
                            onSortDirectionChange={setSortDirection}
                            onSortParamChange={setSortParam}
                            pageSize={parseInt(limit ?? "1")}
                            sortDirection={(sortDirection ?? "desc") as "asc" | "desc"}
                            sortParam={sortParam ?? ""}
                        />
                    </Grid>
                    {!loading && data?.data?.docs.length && parseInt(limit ?? "10") === data.data.totalDocs &&
                        <Grid item xs={12} className={classes.cardPadding}>
                            <StatPaper
                                billAmount={data.data.docs.map(bill => bill.billAmount).reduce((acc, curr) => acc + curr, 0)}
                                billAmountBalance={data.data.docs.map(bill => bill.billAmount - bill.paidAmount).reduce((acc, curr) => acc + curr, 0)}
                                billDiscounts={data.data.docs.map(bill => bill.discountAmount).reduce((acc, curr) => acc + curr, 0)}
                                paidAmount={data.data.docs.map(bill => bill.paidAmount).reduce((acc, curr) => acc + curr, 0)}
                                title="Consolidated Bill Amounts"
                            />
                        </Grid>
                    }
                    {(data?.data?.docs.length && !loading)
                        ? data.data.docs.map((bill: BillData, key: any) =>
                            <React.Fragment key={key}>
                                <Grid item xs={12} className={classes.cardPadding}>
                                    <Fade bottom>
                                        <BillCard
                                            primaryText={bill.customer.name}
                                            rightPrimary={bill.billAmount}
                                            secondaryText={`#${bill.serialNumber} | Received ₹ ${bill.paidAmount}`}
                                            timestamp={moment(bill.createdAt.toString()).format('MMM D YYYY, h:mm a')}
                                            rightSecondary={(
                                                <>
                                                    {bill.credit
                                                        ? <span className={classes.redText}>IN CREDIT</span>
                                                        : <span className={classes.greenText}>CLOSED</span>
                                                    }&nbsp;
                                                        {bill.credit
                                                        ? <TollIcon fontSize="inherit" style={{ verticalAlign: "text-top" }} className={classes.redText} />
                                                        : <CheckCircleIcon fontSize="inherit" style={{ verticalAlign: "text-top" }} className={classes.greenText} />}
                                                </>
                                            )}
                                            location={bill.location?.coordinates}
                                            deleteAction={() => deleteBill(bill._id)}
                                            onClickAction={() => history.push((paths.billsHome + billsPaths.billDetail).replace(":id", bill._id))}
                                        />
                                    </Fade>
                                </Grid>
                            </React.Fragment>
                        )
                        : loading
                            ? <Grid item xs>
                                <ParagraphIconCard
                                    icon={<Zoom in={loading}><CircularProgress /></Zoom>}
                                    heading="Bills loading"
                                    content="Please wait while fetching the list of Bills"
                                />
                            </Grid>
                            : !loading && data?.data?.totalDocs === 0
                                ? <Grid item xs>
                                    <ParagraphIconCard
                                        icon={<LineWeightRounded fontSize="large" />}
                                        heading="No bills yet"
                                        content={<>Click on <strong>Add New Bill</strong> icon to add a new bill which you can see here.</>} />
                                </Grid>
                                : <></>
                    }
                    {data?.data?.hasPrevPage &&
                        <Grid item className={classes.cardPadding} style={{ textAlign: "center" }}>
                            <Fade bottom>
                                <Button disabled={loading} onClick={() => setPageNumber((data?.data?.prevPage ?? parseInt(pageNumber ?? "1") - 1).toString())}>Previous Page</Button>
                            </Fade>
                        </Grid>}
                    {data?.data?.hasNextPage &&
                        <Grid item className={classes.cardPadding} style={{ textAlign: "center" }}>
                            <Fade bottom>
                                <Button disabled={loading} onClick={() => setPageNumber((data?.data?.nextPage ?? parseInt(pageNumber ?? "1") + 1).toString())}>Next Page</Button>
                            </Fade>
                        </Grid>}
                </Grid>
            </PageContainer>
            <Fab onClick={() => history.push(paths.billsHome + billsPaths.addBill)} className={classes.fab} color="primary" variant="extended">
                <AddIcon className={classes.fabIcon} />
                        New Bill
                </Fab>
        </React.Fragment>
    )
}