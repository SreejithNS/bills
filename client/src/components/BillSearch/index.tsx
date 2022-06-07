import React, { useEffect, useState } from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { Button, Checkbox, Collapse, FormControl, FormControlLabel, FormLabel, Grid, IconButton, InputLabel, makeStyles, MenuItem, Radio, RadioGroup, Select, TextField, TextFieldProps, Theme, Tooltip } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { Customer } from "../../reducers/customer.reducer";
import { APIResponse, axios, handleAxiosError } from "../Axios";
import { BillData } from "../../reducers/bill.reducer";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import clsx from "clsx";
import { UserData } from "../../reducers/auth.reducer";
import { useSelector } from "react-redux";
import { RootState } from "../../reducers/rootReducer";
import ClearIcon from '@material-ui/icons/Clear';
import { useHistory } from "react-router";
import { paths } from "../../routes/paths.enum";
import { KeyboardDatePicker } from "@material-ui/pickers";
import moment, { Moment } from "moment";

const useStyles = makeStyles((theme: Theme) => ({
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

function CustomerSelection(props: {
    customer: Customer | undefined;
    onChange: (value: Customer) => void;
    disabled?: boolean;
}) {
    const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
    const [customerInputValue, setCustomerInputValue] = useState<Customer["name"]>("");

    useEffect(() => {
        if (customerInputValue) {
            setCustomerSuggestions([]);
            axios
                .get<APIResponse<Customer[]>>("/customer/suggestions/" + customerInputValue)
                .then((response) => {
                    let data = response.data.data;
                    if (data?.length) {
                        setCustomerSuggestions(data);
                    }
                }, handleAxiosError);
        }
    }, [customerInputValue]);

    return (
        <Autocomplete
            value={props.customer}
            options={customerSuggestions}
            autoHighlight
            getOptionLabel={(option: Customer) => option.name}
            onInputChange={(event: any, val: Customer["name"]) => setCustomerInputValue(val)}
            onChange={(event, newValue) => props.onChange(newValue as unknown as Customer)}
            selectOnFocus
            freeSolo
            handleHomeEndKeys
            disabled={props.disabled}
            fullWidth={true}
            renderInput={(params) => <TextField {...params} label="Customer Name" margin="dense" variant="outlined" size="small" />}
        />
    );
}

export function SalesmanSelection(props: {
    salesman: UserData | undefined;
    onChange: (value: UserData | null) => void;
    disabled?: boolean;
    inputProps?: TextFieldProps
}) {
    const salesmenList = useSelector((state: RootState) => {
        const { usersUnderUser, userData } = state.auth;
        let list = [...(usersUnderUser ?? [])];
        if (userData) list.push(userData);
        return list;
    });

    return (
        <Autocomplete
            value={props.salesman}
            options={salesmenList ?? []}
            autoHighlight
            getOptionLabel={(option: UserData) => option.name}
            onChange={(_, newValue) => props.onChange(newValue as unknown as UserData | null)}
            selectOnFocus
            freeSolo
            disabled={props.disabled}
            handleHomeEndKeys
            fullWidth={true}
            size="small"
            renderInput={(params) => <TextField {...params} label="Salesman" margin="dense" {...props.inputProps} />}
        />
    );
}


type Props = {
    disableSearch?: boolean;
    expanded?: boolean;
    onSearchParamChange: (param: string) => void;
    onSearchValueChange: (param: string) => void;
    creditFilter: string;
    onCreditFilterChange: (value: string) => void;
    selectedFromDate: string | null;
    onSelectedFromDateChange: (valuee: string | null) => void;
    selectedToDate: string | null;
    onSelectedToDateChange: (valuee: string | null) => void;
    sortParam: string;
    sortDirection: "asc" | "desc";
    searchParam?: string;
    pageSize?: number;
    onShowAllChange?: (value: boolean) => void;
    showAll?: boolean;
    onPageSizeChange?: (pageSize: number) => void;
    onSortParamChange: (param: keyof BillData) => void;
    onSortDirectionChange: (direction: Props["sortDirection"]) => void;
};

export default function BillSearch(props: Props) {
    const classes = useStyles();
    const history = useHistory();
    const [customer, setCustomer] = useState<Customer>();
    const [serialNumber, setserialNumber] = useState<number>();
    const [salesman, setSalesman] = useState<UserData>();

    const [expanded, setExpanded] = useState(props.expanded ?? false);

    const onSearch = () => {
        const { onSearchValueChange } = props;
        switch (searchParam) {
            case "serial":
                onSearchValueChange(serialNumber?.toString() ?? "");
                setserialNumber(undefined);
                break;
            case "customer":
                onSearchValueChange(customer?._id ?? "");
                setCustomer(undefined);
                break;
            case "soldBy":
                onSearchValueChange(salesman?._id ?? "");
                setSalesman(undefined);
                break;
            default:
                break;
        }
    }

    const parseDTODate = (now: string | null) => {
        if (now === null || !now) return null;
        return moment(parseInt(now))
    }
    const parseInputDate = (period: "start" | "end") => (date: Moment | null) => {
        if (date === null) return null;
        return (date[period === "start" ? "startOf" : "endOf"]("day").valueOf() || "").toString();
    }

    const handleClearCreditFilter = (e: any) => {
        if (e.target.value === props.creditFilter) {
            props.onCreditFilterChange("");
        }
    }

    const { searchParam } = props;

    const searchDisabled = props.disableSearch ?? false;
    return (
        <Card className={classes.root} variant="outlined" >
            <CardContent className={classes.content}>
                <form onSubmit={e => { e.preventDefault(); onSearch(); }}>
                    <Grid container direction="row" justify="space-around" alignItems="center" spacing={2}>
                        <Grid item>
                            <FormControl disabled={searchDisabled} variant="outlined" size="small" margin="dense">
                                <InputLabel>Field</InputLabel>
                                <Select
                                    labelId="demo-simple-select-outlined-label"
                                    value={searchParam}
                                    onChange={(e) => props.onSearchParamChange(e.target.value as string)}
                                    label="Field"
                                >
                                    <MenuItem value={"serial"}>Serial</MenuItem>
                                    <MenuItem value={"customer"}>Customer</MenuItem>
                                    <MenuItem value={"soldBy"}>Sold By</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs>
                            {searchParam === "serial" &&
                                <TextField
                                    disabled={searchDisabled}
                                    value={serialNumber}
                                    margin="dense"
                                    onChange={(e) => setserialNumber(Math.abs(parseInt(e.target.value)))}
                                    id="outlined-search"
                                    label="Serial Number"
                                    type="number"
                                    variant="outlined" size="small"
                                    fullWidth
                                />}
                            {searchParam === "customer" &&
                                <CustomerSelection
                                    disabled={searchDisabled}
                                    customer={customer}
                                    onChange={(value) => setCustomer(value ?? undefined)}
                                />}
                            {searchParam === "soldBy" &&
                                <SalesmanSelection
                                    disabled={searchDisabled}
                                    salesman={salesman}
                                    inputProps={{ variant: "outlined" }}
                                    onChange={(value) => setSalesman(value ?? undefined)}
                                />}
                        </Grid>
                        <Grid item>
                            <Button variant="contained" type="submit">Search</Button>
                        </Grid>
                        <Grid item>
                            <Tooltip title="Clear All Filters">
                                <IconButton
                                    onClick={() => history.push(paths.billsHome + "?")}
                                    aria-label="show more"
                                >
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        </Grid>
                        <Grid item>
                            <Tooltip title="More Search Filters">
                                <IconButton
                                    className={clsx(classes.expand, {
                                        [classes.expandOpen]: expanded,
                                    })}
                                    onClick={() => setExpanded(!expanded)}
                                    aria-expanded={expanded}
                                    aria-label="show more"
                                >
                                    <ExpandMoreIcon />
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </form>
            </CardContent>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                    <Grid container direction="row" justify="flex-start" alignItems="flex-start" spacing={2}>
                        <Grid item>
                            <KeyboardDatePicker
                                autoOk
                                inputVariant="outlined"
                                size="small"
                                label="Starting Date"
                                disableFuture
                                format="DD/MM/yyyy"
                                InputAdornmentProps={{ position: "start" }}
                                value={parseDTODate(props.selectedFromDate)}
                                onChange={(date) => props.onSelectedFromDateChange(parseInputDate("start")(date))}
                            />
                        </Grid>
                        <Grid item>
                            <KeyboardDatePicker
                                autoOk
                                size="small"
                                inputVariant="outlined"
                                label="Ending Date"
                                format="DD/MM/yyyy"
                                disableFuture
                                InputAdornmentProps={{ position: "start" }}
                                value={parseDTODate(props.selectedToDate)}
                                onChange={date => props.onSelectedToDateChange(parseInputDate("end")(date))}
                            />
                        </Grid>
                        {(props.onPageSizeChange && props.pageSize) && <Grid item>
                            <TextField
                                label="Page Size"
                                type="number"
                                variant="outlined" size="small"
                                onChange={(v) => props.onPageSizeChange && props.onPageSizeChange(parseInt(v.target.value))}
                                value={props.pageSize}
                            />
                        </Grid>}
                        <Grid item>
                            <FormControl variant="outlined" size="small">
                                <InputLabel id="demo-simple-select-outlined-label">Sort By</InputLabel>
                                <Select
                                    labelId="demo-simple-select-outlined-label"
                                    value={props.sortParam}
                                    onChange={(e) => props.onSortParamChange(e.target.value as keyof BillData)}
                                    label="Sort By"
                                >
                                    <MenuItem value={"createdAt"}>Created At</MenuItem>
                                    <MenuItem value={"updatedAt"}>Payment Received</MenuItem>
                                    <MenuItem value={"paidAmount"}>Paid Amount</MenuItem>
                                    <MenuItem value={"billAmount"}>Bill Amount</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item>
                            <FormControl variant="outlined" size="small">
                                <InputLabel id="demo-simple-select-outlined-label">Sort Order</InputLabel>
                                <Select
                                    labelId="demo-simple-select-outlined-label"
                                    value={props.sortDirection}
                                    onChange={(e) => props.onSortDirectionChange(e.target.value as "asc" | "desc")}
                                    label="Sort By"
                                >
                                    <MenuItem value={"asc"}>Lowest to Highest</MenuItem>
                                    <MenuItem value={"desc"}>Highest to Lowest</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item>
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Credit Filter</FormLabel>
                                <RadioGroup inlist value={props.creditFilter} onChange={(e) => props.onCreditFilterChange(e.target.value)}>
                                    <FormControlLabel value="0" control={<Radio />} onClick={handleClearCreditFilter} label="Only Closed" />
                                    <FormControlLabel value="1" control={<Radio />} onClick={handleClearCreditFilter} label="Only Credited" />
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                        {props.showAll !== undefined && props.onShowAllChange !== undefined && <Grid item>
                            <FormControlLabel
                                control={<Checkbox checked={props.showAll} onChange={(e) => props.onShowAllChange && props.onShowAllChange(e.target.checked)} />}
                                label="Show all bills"
                            />
                        </Grid>}
                    </Grid>
                </CardContent>
            </Collapse>
        </Card>
    );
}