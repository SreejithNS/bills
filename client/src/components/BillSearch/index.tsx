import React from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { Button, createStyles, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Theme, WithStyles, withStyles } from "@material-ui/core";
import { connect } from "react-redux";
import { fetchBillList } from "../../actions/bill.actions";
import { Autocomplete } from "@material-ui/lab";
import { compose } from "redux";
import { RootState } from "../../reducers/rootReducer";
import { ThunkDispatch } from "redux-thunk";
import { fetchCustomerSuggestions } from "../../actions/customer.action";
import { toast } from "react-toastify";


const styles = (theme: Theme) => createStyles({
    root: {
        minWidth: theme.breakpoints.width("xs")
    },
    content: {
        "&:last-child": {
            paddingBottom: theme.spacing(2)
        }
    }
});

const mapStateToProps = (state: RootState) => {
    return {
        customerSuggestions: state.customer.customerSuggestions,
    }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<{}, {}, any>) => {
    return {
        getCustomerSuggestions: (val: string) => dispatch(fetchCustomerSuggestions(val)),
        searchBill: (queryParams: any) => dispatch(fetchBillList(true, queryParams)),
        resetList: () => dispatch({ type: "RESET_BILLS_LIST" })
    }
}

type Props = WithStyles<typeof styles> & ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

class BillSearch extends React.Component<Props> {

    state = {
        customer: { id: "", name: "" },
        serialNumber: "",
        option: 0,
        customQueried: false,
    }

    setSerial = (e: { target: { value: React.SetStateAction<string>; }; }) => this.setState({ serialNumber: e.target.value });
    setCustomer = (value: any) => this.setState({ customer: value });
    selectOption = (event: any) => {
        this.setState({ option: event.target?.value });
    };

    handleCustomerChange = (event: any, newValue: any) => {
        const { customerSuggestions } = this.props;
        const { setCustomer } = this;
        if (typeof newValue === 'string') {
            setCustomer(customerSuggestions.find((customer: { name: string; }) => customer.name === newValue))
        } else if (newValue && newValue.id) {
            setCustomer(newValue);
        } else {
            toast.error("Customer Error: Customer name is required")
        }
    }

    onSearch = () => {
        const { option, serialNumber, customer } = this.state;
        const { searchBill, resetList } = this.props;
        resetList();
        this.setState({ customQueried: true })
        switch (option) {
            case 0:
                searchBill({ serial: serialNumber });
                break;
            case 1:
                searchBill({ customer: customer.id });
                break;
            default:
        }
    }

    render() {
        const { classes, customerSuggestions, getCustomerSuggestions } = this.props;
        const { customer, serialNumber, option } = this.state;
        const { handleCustomerChange, onSearch, setSerial, selectOption } = this;
        return (
            <Card className={classes.root} variant="outlined">
                <CardContent className={classes.content}>
                    <form onSubmit={e => { e.preventDefault(); console.warn("hi"); onSearch(); }}>
                        <Grid container direction="row" justify="space-around" alignItems="center" spacing={2}>
                            <Grid item xs>
                                <FormControl variant="outlined" margin="dense">
                                    <InputLabel>Which</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-outlined-label"
                                        value={option}
                                        onChange={selectOption}
                                        label="Which"
                                    >
                                        <MenuItem value={0}>Serial</MenuItem>
                                        <MenuItem value={1}>Customer</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={10} md={8}>
                                {option === 0 && <TextField value={serialNumber} margin="dense" onChange={setSerial} id="outlined-search" label="Serial Number" type="search" variant="outlined" fullWidth />}
                                {option === 1 && <Autocomplete
                                    value={customer}
                                    options={customerSuggestions}
                                    autoHighlight
                                    getOptionLabel={(option: any) => option.name}
                                    onInputChange={(event: any, val: string) => getCustomerSuggestions(val)}
                                    onChange={handleCustomerChange}
                                    selectOnFocus
                                    freeSolo
                                    handleHomeEndKeys
                                    fullWidth={true}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Customer Name" margin="dense" variant="outlined" />
                                    )}
                                />}
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <Button variant="contained" type="submit">Search</Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
        );
    }
}

export default compose(withStyles(styles), connect(mapStateToProps, mapDispatchToProps))(BillSearch) as React.ComponentType;
