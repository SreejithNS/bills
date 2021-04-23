import * as React from 'react'
import { CircularProgress, Fab, Grid, Theme, Zoom, Typography, Button, makeStyles } from '@material-ui/core';
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
const Fade = require('react-reveal/Fade');

const useStyles = makeStyles((theme: Theme) => ({
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
    }
}))

export default function BillsHomePage() {
    const [pageNumber, setPageNumber] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [sortParam, setSortParam] = useState<keyof BillData>("createdAt");
    const [search, setSearch] = useState<Object | undefined>();
    const [requestLoading, setRequestLoading] = useState(false);

    type ResponseData = APIResponse<PaginateResult<BillData>>;

    const [{ loading: getLoading, error, data }, execute] = useAxios<ResponseData>({
        url: "/bill",
        params: {
            page: pageNumber,
            limit,
            sort: (sortDirection === "desc" ? "-" : "") + sortParam,
            ...(search && search),
        }
    }, { manual: true })

    useEffect(() => {
        execute();
    }, [])

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

    const handleSearch = (param: string, value: string) => {
        if (value === "") {
            setSearch(undefined);
        } else {
            setSearch({ [param]: value })
        }
    }

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
                            onPageSizeChange={setLimit}
                            onSearch={handleSearch}
                            onSortDirectionChange={setSortDirection}
                            onSortParamChange={setSortParam}
                            pageSize={limit}
                            sortDirection={sortDirection}
                            sortParam={sortParam}
                        />
                    </Grid>
                    {
                        (data?.data?.docs.length && !loading)
                            ? data.data.docs.map((bill: BillData, key: any) =>
                                <React.Fragment key={key}>
                                    <Grid item xs={12} className={classes.cardPadding}>
                                        <Fade bottom>
                                            <BillCard
                                                primaryText={bill.customer.name}
                                                rightPrimary={bill.billAmount}
                                                secondaryText={`Received ₹ ${bill.paidAmount}`}
                                                timestamp={moment(bill.createdAt.toString()).format('MMM D YYYY, h:mm a')}
                                                rightSecondary={(
                                                    <>
                                                        {bill.credit ? "IN CREDIT" : "CLOSED"}&nbsp;
                                                        {bill.credit ? <TollIcon fontSize="inherit" style={{ verticalAlign: "text-top" }} /> : <CheckCircleIcon fontSize="inherit" style={{ verticalAlign: "text-top" }} />}
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
                                <Button disabled={loading} onClick={() => setPageNumber(data?.data?.prevPage ?? pageNumber - 1)}>Previous Page</Button>
                            </Fade>
                        </Grid>}
                    {data?.data?.hasNextPage &&
                        <Grid item className={classes.cardPadding} style={{ textAlign: "center" }}>
                            <Fade bottom>
                                <Button disabled={loading} onClick={() => setPageNumber(data?.data?.nextPage ?? pageNumber + 1)}>Next Page</Button>
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