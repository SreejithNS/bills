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
import { Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, Divider, Typography } from '@material-ui/core';
import { UserData } from '../../reducers/auth.reducer';
import { useSelector } from 'react-redux';
import { RootState } from '../../reducers/rootReducer';
import moment, { Moment } from "moment";
import { KeyboardDatePicker } from '@material-ui/pickers';

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
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [productCategory, setProductCategory] = useState<string>("");
    const productCategories = useSelector((state: RootState) => state.product.productCategoryList)
    const [{ loading, error, response }, execute, cancel] = useAxios<Blob>({
        url: "/bill/productSalesAsCSV",
        params: {
            startDate, endDate, soldBy: salesman?._id, category: productCategory === "" ? undefined : productCategory,
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

    const parseDTODate = (now: string | null) => {
        if (now === null || !now) return null;
        return moment(parseInt(now))
    }
    const parseInputDate = (period: "start" | "end") => (date: Moment | null) => {
        if (date === null) return null;
        return (date[period === "start" ? "startOf" : "endOf"]("day").valueOf() || "").toString();
    }

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
                        <Grid item xs={6}>
                            <FormControl variant="outlined" size="small" margin="dense" fullWidth>
                                <InputLabel>Product Category</InputLabel>
                                <Select
                                    value={productCategory}
                                    onChange={(e) => setProductCategory(e.target.value as string)}
                                    label="Product Category"
                                >
                                    <MenuItem value={""}>"ALL CATEGORIES"</MenuItem>
                                    {productCategories.map((category) => <MenuItem value={category._id}>{category.name.toLocaleUpperCase()}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs>
                            <KeyboardDatePicker
                                autoOk
                                inputVariant="outlined"
                                size="small"
                                label="Starting Date"
                                disableFuture
                                format="DD/MM/yyyy"
                                InputAdornmentProps={{ position: "start" }}
                                value={parseDTODate(startDate)}
                                onChange={(date) => setStartDate(parseInputDate("start")(date))}
                            />
                        </Grid>
                        <Grid item xs>
                            <KeyboardDatePicker
                                autoOk
                                size="small"
                                inputVariant="outlined"
                                label="Ending Date"
                                format="DD/MM/yyyy"
                                disableFuture
                                InputAdornmentProps={{ position: "start" }}
                                value={parseDTODate(endDate)}
                                onChange={date => setEndDate(parseInputDate("end")(date))}
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
