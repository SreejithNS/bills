import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { CloudDownloadRounded } from '@material-ui/icons';
import useAxios from 'axios-hooks';
import Modal, { ModalProps } from '../Modal';
import { handleAxiosError } from '../Axios';
import BillSearch, { SalesmanSelection } from '../BillSearch';
import { useQueryStringKey } from 'use-route-as-state';
import fileDownload from "js-file-download";
import { Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, TextField, Divider, Typography } from '@material-ui/core';
import { UserData } from '../../reducers/auth.reducer';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        dropZone: {
            height: "auto",
            //margin: theme.spacing(2)
        },
        root: {
            display: "flex",
            alignContent: "stretch",
            justifyContent: "center",
            flexFlow: "column wrap",
            "&>*": {
                margin: theme.spacing(1)
            }
        }
    }),
);

const useProductSalesFilterStyles = makeStyles((theme: Theme) => ({
    root: {
        minWidth: theme.breakpoints.width("xs")
    },
    content: {
        "&:last-child": {
            paddingBottom: theme.spacing(2)
        }
    },
    expand: {
        transform: 'rotate(0deg)',
        marginLeft: 'auto',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest,
        }),
    },
    expandOpen: {
        transform: 'rotate(180deg)',
    },
}));

function ProductWiseSalesFilter() {
    const classes = useProductSalesFilterStyles();
    const [salesman, setSalesman] = useState<UserData>();
    const [month, setMonth] = useState(1);
    const [year, setYear] = useState((new Date().getFullYear()));

    const [{ loading, error, response }, execute, cancel] = useAxios<Blob>({
        url: "/bill/productSalesAsCSV",
        params: {
            year, month, soldBy: salesman?._id
        }, responseType: 'blob'
    }, { useCache: false, manual: true });

    useEffect(() => {
        if (response && !loading) {
            debugger;
            const fileName = response.headers["x-bills-report-filename"];
            fileDownload(response.data, fileName)
        }
    }, [response, loading]);

    useEffect(() => {
        if (error) handleAxiosError(error);
    }, [error]);

    useEffect(() => () => cancel(), [cancel]);

    const onSearch = () => execute();

    return (<>
        <Card className={classes.root} variant="outlined" >
            <CardContent className={classes.content}>
                <form onSubmit={e => { e.preventDefault(); onSearch(); }}>
                    <Grid container direction="row" justify="space-around" alignItems="center" spacing={2}>
                        <Grid item xs={6}>
                            <SalesmanSelection
                                salesman={salesman}
                                onChange={(value) => setSalesman(value ?? undefined)}
                            />
                        </Grid>
                        <Grid item xs>
                            <FormControl variant="outlined" size="small" margin="dense" fullWidth>
                                <InputLabel>Month</InputLabel>
                                <Select
                                    value={month}
                                    onChange={(e) => setMonth(parseInt((e.target.value as string).toString() as string))}
                                    label="Month"
                                >
                                    <MenuItem value={1}>January</MenuItem>
                                    <MenuItem value={2}>February</MenuItem>
                                    <MenuItem value={3}>March</MenuItem>
                                    <MenuItem value={4}>April</MenuItem>
                                    <MenuItem value={5}>May</MenuItem>
                                    <MenuItem value={6}>June</MenuItem>
                                    <MenuItem value={7}>July</MenuItem>
                                    <MenuItem value={8}>August</MenuItem>
                                    <MenuItem value={9}>September</MenuItem>
                                    <MenuItem value={10}>October</MenuItem>
                                    <MenuItem value={11}>November</MenuItem>
                                    <MenuItem value={12}>December</MenuItem>
                                    <MenuItem value={"customer"}>Customer</MenuItem>
                                    <MenuItem value={"soldBy"}>Sold By</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs>
                            <TextField
                                label="Year"
                                type="number"
                                variant="outlined" size="small"
                                inputProps={{
                                    step: 1,
                                    min: 2021
                                }}
                                onChange={(v) => setYear(parseInt(v.target.value))}
                                value={year}
                            />
                        </Grid>
                    </Grid>
                </form>
            </CardContent>
        </Card>
        <Button disabled={loading} variant="contained" onClick={() => execute()} startIcon={<CloudDownloadRounded />} >Download</Button>
    </>
    )
}

export default function ReportDownloadModal(props: ModalProps) {
    const classes = useStyles();

    const [sortParam, setSortParam] = useQueryStringKey("sortParam", "createdAt");
    const [sortDirection, setSortDirection] = useQueryStringKey("sortDirection", "desc");
    const [searchParam, setSearchParam] = useQueryStringKey("searchParam", "customer");
    const [searchValue, setSearchValue] = useQueryStringKey("searchValue");
    const [selectedFromDate, setSelectedFromDate] = useQueryStringKey("fromDate");
    const [selectedToDate, setSelectedToDate] = useQueryStringKey("toDate");
    const [creditFilter, setCreditFilter] = useQueryStringKey("credit");

    const [{ loading, error, response }, execute, cancel] = useAxios<Blob>({
        url: "/bill/asCSV",
        params: {
            page: 1,
            sort: (sortDirection === "desc" ? "-" : "") + sortParam,
            ...((searchParam && searchValue) && { [searchParam]: searchValue }),
            ...(selectedFromDate && { "startDate": selectedFromDate }),
            ...(selectedToDate && { "endDate": selectedToDate }),
            ...(creditFilter && { credit: creditFilter === "1" })
        }, responseType: 'blob'
    }, { useCache: false, manual: true });

    useEffect(() => {
        if (response && !loading) {
            debugger;
            const fileName = response.headers["x-bills-report-filename"];
            fileDownload(response.data, fileName)
        }
    }, [response, loading]);

    useEffect(() => {
        if (error) handleAxiosError(error);
    }, [error]);

    useEffect(() => () => cancel(), [cancel]);

    return (
        <Modal title="Export Bill Data as Report CSV">
            <div className={classes.root}>
                <Typography variant="h5">
                    Bills Report
                </Typography>
                <BillSearch
                    expanded={true}
                    creditFilter={creditFilter ?? ""}
                    onCreditFilterChange={setCreditFilter}
                    selectedToDate={selectedToDate || null}
                    selectedFromDate={selectedFromDate || null}
                    onSelectedToDateChange={(value) => setSelectedToDate(value ?? "")}
                    onSelectedFromDateChange={(value) => setSelectedFromDate(value ?? "")}
                    searchParam={searchParam}
                    onSearchParamChange={setSearchParam}
                    onSearchValueChange={setSearchValue}
                    onSortDirectionChange={setSortDirection}
                    onSortParamChange={setSortParam}
                    sortDirection={(sortDirection ?? "desc") as "asc" | "desc"}
                    sortParam={sortParam ?? ""}
                />
                <Button disabled={loading} variant="contained" onClick={() => execute()} startIcon={<CloudDownloadRounded />} >Download</Button>
            </div>
            <Divider style={{ margin: "1em 0em" }} />
            <div className={classes.root}>
                <Typography variant="h5">
                    Product-wise Sales Report
                </Typography>
                <ProductWiseSalesFilter />
            </div>
        </Modal>
    );
}
