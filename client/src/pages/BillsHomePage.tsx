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
import { useState } from 'react';
import useAxios from 'axios-hooks';
import { APIResponse } from '../components/Axios';
import { BillData, PaginateResult } from '../reducers/bill.reducer';
import { toast } from 'react-toastify';
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
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [sortParam, setSortParam] = useState<keyof BillData>("createdAt");
    const [search, setSearch] = useState<Object | undefined>()

    type ResponseData = APIResponse<PaginateResult<BillData>>;

    const [{ loading, error, data }] = useAxios<ResponseData>({
        url: "/bill",
        params: {
            page: pageNumber,
            limit,
            sort: (sortDirection === "desc" ? "-" : "") + sortParam,
            ...(search && search),
        }
    })

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
                                                customerName={bill.customer.name}
                                                billAmount={bill.billAmount}
                                                timestamp={bill.createdAt.toString()}
                                                deleteAction={console.log}
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