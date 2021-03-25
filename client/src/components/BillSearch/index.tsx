import React, { useEffect, useState } from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { Button, CardActions, Collapse, FormControl, Grid, IconButton, InputLabel, makeStyles, MenuItem, Select, TextField, Theme, Typography } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { Customer } from "../../reducers/customer.reducer";
import { APIResponse, axios, handleAxiosError } from "../Axios";
import { BillData } from "../../reducers/bill.reducer";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import clsx from "clsx";

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
            fullWidth={true}
            renderInput={(params) => <TextField {...params} label="Customer Name" margin="dense" variant="outlined" />}
        />
    );
}


type Props = {
    onSearch: (param: string, value: string) => void;
    sortParam: string;
    sortDirection: "asc" | "desc";
    pageSize: number;
    onPageSizeChange: (pageSize: number) => void;
    onSortParamChange: (param: keyof BillData) => void;
    onSortDirectionChange: (direction: Props["sortDirection"]) => void;
};

export default function BillSearch(props: Props) {
    const classes = useStyles();
    const [customer, setCustomer] = useState<Customer>();
    const [serialNumber, setserialNumber] = useState<number>();
    const [searchParam, setSearchParam] = useState<string>("customer");

    const [expanded, setExpanded] = useState(false);

    const onSearch = () => {
        const { onSearch } = props;
        switch (searchParam) {
            case "serial":
                onSearch(searchParam, serialNumber?.toString() ?? "");
                setserialNumber(undefined);
                break;
            case "customer":
                onSearch(searchParam, customer?._id ?? "");
                setCustomer(undefined);
                break;
            default:
                break;
        }
    }

    return (
        <Card className={classes.root} variant="outlined">
            <CardContent className={classes.content}>
                <form onSubmit={e => { e.preventDefault(); onSearch(); }}>
                    <Grid container direction="row" justify="space-around" alignItems="center" spacing={2}>
                        <Grid item>
                            <FormControl variant="outlined" margin="dense">
                                <InputLabel>Field</InputLabel>
                                <Select
                                    labelId="demo-simple-select-outlined-label"
                                    value={searchParam}
                                    onChange={(e) => setSearchParam(e.target.value as string)}
                                    label="Field"
                                >
                                    <MenuItem value={"serial"}>Serial</MenuItem>
                                    <MenuItem value={"customer"}>Customer</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs>
                            {searchParam === "serial" &&
                                <TextField
                                    value={serialNumber}
                                    margin="dense"
                                    onChange={(e) => setserialNumber(Math.abs(parseInt(e.target.value)))}
                                    id="outlined-search"
                                    label="Serial Number"
                                    type="number"
                                    variant="outlined"
                                    fullWidth
                                />}
                            {searchParam === "customer" &&
                                <CustomerSelection
                                    customer={customer}
                                    onChange={(value) => setCustomer(value ?? undefined)}
                                />}
                        </Grid>
                        <Grid item>
                            <Button variant="contained" type="submit">Search</Button>
                        </Grid>
                        <Grid item>
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
                        </Grid>
                    </Grid>
                </form>
            </CardContent>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                    <Grid container direction="row" justify="flex-start" alignItems="center" spacing={2}>
                        <Grid item>
                            <TextField
                                label="Page Size"
                                type="number"
                                variant="outlined"
                                onChange={(v) => props.onPageSizeChange(parseInt(v.target.value))}
                                value={props.pageSize}
                            />
                        </Grid>
                        <Grid item>
                            <FormControl variant="outlined">
                                <InputLabel id="demo-simple-select-outlined-label">Sort By</InputLabel>
                                <Select
                                    labelId="demo-simple-select-outlined-label"
                                    value={props.sortParam}
                                    onChange={(e) => props.onSortParamChange(e.target.value as keyof BillData)}
                                    label="Sort By"
                                >
                                    <MenuItem value={"createdAt"}>Created At</MenuItem>
                                    <MenuItem value={"paidAmount"}>Paid Amount</MenuItem>
                                    <MenuItem value={"billAmount"}>Bill Amount</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item>
                            <FormControl variant="outlined">
                                <InputLabel id="demo-simple-select-outlined-label">Sort By</InputLabel>
                                <Select
                                    labelId="demo-simple-select-outlined-label"
                                    value={props.sortDirection}
                                    onChange={(e) => props.onSortDirectionChange(e.target.value as "asc" | "desc")}
                                    label="Sort By"
                                >
                                    <MenuItem value={"asc"}>Lowest to Highest</MenuItem>
                                    <MenuItem value={"desc"}>Lowest to Highes</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Collapse>
        </Card>
    );
}