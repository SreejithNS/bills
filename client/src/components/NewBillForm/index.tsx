import React from "react";
import TextField from "@material-ui/core/TextField";
import { Button, Checkbox, CircularProgress, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, Zoom } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import MaterialTable from "material-table";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { fetchCustomerSuggestions } from "../../actions/customer.action";
import { fetchItemSuggesions } from "../../actions/item.actions";
import { createFilterOptions } from '@material-ui/lab/Autocomplete';
import NewCustomerCreationModal from "../NewCustomerCreationModal";
import { addItem, saveBill, setCustomer as setCustomerAction } from "../../actions/bill.actions";
import { toast } from "react-toastify";
import { getBillAmount, getItemsTotalAmount } from "../../reducers/bill.reducer";
import { tableIcons } from "../MaterialTableIcons";

interface DispatchProps {
    getCustomerSuggestions(phrase: string): void;
    getItemSuggestions(code: string): void;
    setCustomer(id: string): void;
    setDiscountAmount(amount: number): void;
    setDiscountPercentage(percentage: number): void;
    addItem(id: string, quantity: number, unit: number): void;
    updateQuantity(id: string, newQuantity: number, unit: number): void;
    setCredit(isCredit: boolean): void;
    setPaidAmount(paidAmount: number): void;
    saveBill(): Promise<any> | any;
}

interface StateProps {
    customerSuggestions: any[];
    customer: any;
    itemSuggestions: any[];
    items: any[];
    itemsLoad: boolean;
    itemsTotalAmount: number;
    billAmount: number;
    discountAmount: number;
    discountPercentage: number;
    billSaveLoad: boolean;
    credit: boolean;
    paidAmount: number;
}

interface ComponentProps {
    closeModal(): void;
}


class NewBillForm extends React.Component<StateProps & DispatchProps & ComponentProps> {
    state = {
        customerModal: {
            name: "",
            visible: false
        },
        item: {
            id: "",
            code: "",
            name: "",
            quantity: 0,
            units: [],
            unit: -1,
        }
    };
    openCustomerModal = (name: string) => {
        this.setState(prevState => {
            const newState: any = { ...prevState };
            newState.customerModal.name = name;
            newState.customerModal.visible = true;
            return newState;
        });
    }
    closeCustomerModal = () => {
        this.setState(prevState => {
            const newState: any = { ...prevState };
            newState.customerModal.visible = false;
            return newState;
        });
    }

    handleCustomerChange = (event: any, newValue: { inputValue?: string; id: string }) => {
        const { setCustomer, customerSuggestions } = this.props;
        if (typeof newValue === 'string') {
            setCustomer(customerSuggestions.find(customer => customer.name === newValue).id)
        } else if (newValue && newValue.inputValue) {
            this.openCustomerModal(newValue.inputValue);
        } else if (newValue && newValue.id) {
            setCustomer(newValue.id);
        } else {
            toast.error("Customer Error: Customer name is required")
        }
    }

    handleItemCodeChange = (event: any, newValue: { inputValue?: string; id: string }) => {
        if (typeof newValue === 'string') {
            toast.error("Bill Item Error: Wrong Item")
        } else if (newValue && newValue.id) {
            this.setState(prevState => {
                const newState: any = { ...prevState };
                newState.item = newValue;
                newState.item.quantity = 0;
                return newState;
            });
        } else {
            toast.warn("Bill Item: Try adding bill item again")
        }
    }

    handleItemQuantityChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = parseFloat(event.target.value);
        this.setState(prevState => {
            const newState: any = { ...prevState };
            newState.item.quantity = value;
            return newState;
        });
    }

    handleAddItem = (event: any) => {
        const { id, quantity, unit } = this.state.item;
        if (id === "") {
            toast.error("Please select and Item");
        } else if (quantity <= 0) {
            toast.error("Please enter a valid quantity");
        } else {
            this.props.addItem(id, quantity, unit);
        }
    }

    handleItemUnitChange = (event: any) => {
        const index = event.target.value;
        if (index >= 0) this.setState((prevState: { item: { unit: number } }) => {
            const newState = { ...prevState };
            newState.item.unit = index;
            return prevState;
        })
        else this.setState((prevState: { item: { unit: number } }) => {
            const newState = { ...prevState };
            newState.item.unit = -1;
            return prevState;
        })
    };

    render() {
        const { customer, customerSuggestions, itemSuggestions, items, billAmount, discountAmount, itemsLoad, discountPercentage, billSaveLoad, credit, paidAmount, closeModal, setCredit, setPaidAmount, saveBill, setDiscountPercentage, updateQuantity, setDiscountAmount, getCustomerSuggestions, getItemSuggestions } = this.props;
        const { customerModal, item } = this.state;
        const { openCustomerModal, closeCustomerModal, handleItemUnitChange, handleCustomerChange, handleItemCodeChange, handleItemQuantityChange, handleAddItem } = this;

        return (
            <form>
                <Grid
                    container
                    direction="row"
                    justify="space-between"
                    alignItems="center"
                    spacing={3}
                >
                    <Grid item xs={12}>
                        <Autocomplete
                            value={customer}
                            options={customerSuggestions}
                            autoHighlight
                            getOptionLabel={(option: any) => option.name}
                            onInputChange={(event: any, val: string) => getCustomerSuggestions(val)}
                            onChange={handleCustomerChange}
                            selectOnFocus
                            freeSolo
                            handleHomeEndKeys
                            filterOptions={(options, params) => {
                                const filtered = createFilterOptions({ ignoreCase: true })(options, params);

                                if (params.inputValue !== '') {
                                    filtered.push({
                                        name: `Add "${params.inputValue}"`,
                                        inputValue: params.inputValue
                                    });
                                }

                                return filtered;
                            }}
                            fullWidth={true}
                            renderOption={(option) => (
                                <React.Fragment>
                                    {option.name.substring(0, 4) === "Add " ?
                                        <Button onClick={() => openCustomerModal(option.name.substring(5, option.name.length - 1))} >{option.name}</Button>
                                        : option.name}
                                </React.Fragment>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} label="Customer" variant="outlined" />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Autocomplete
                            value={item.name.length ? item : null}
                            options={itemSuggestions}
                            filterOptions={createFilterOptions({
                                ignoreCase: true,
                                stringify: (option: any) => option.code
                            })}
                            getOptionLabel={(option: any) => option.name}
                            onInputChange={(event: any, val: string) => getItemSuggestions(val)}
                            onChange={handleItemCodeChange}
                            fullWidth={true}
                            renderInput={(params) => (
                                <TextField {...params} label="Item Code" variant="outlined" />
                            )}
                        />
                    </Grid>
                    <Grid item xs={4} sm={3}>
                        <TextField
                            label="Quantity"
                            type="number"
                            fullWidth
                            onFocus={(event) => { event.target.select() }} value={item.quantity || 0}
                            onChange={handleItemQuantityChange}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={4} sm>
                        <FormControl variant="outlined" fullWidth>
                            <InputLabel>Unit</InputLabel>
                            <Select
                                value={item.unit !== undefined ? item.unit : -1}
                                onChange={handleItemUnitChange}
                                label="Unit"
                            >
                                <MenuItem value={-1}>
                                    <em>General</em>
                                </MenuItem>
                                {item.units?.length && item.units.map((unit: { name: string, mrp: number; rate: number; }, key) =>
                                    <MenuItem key={key} value={key}>
                                        {unit.name.toUpperCase()}
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4} sm>
                        <Button variant="contained" color="primary" fullWidth onClick={handleAddItem} disableElevation>
                            Add
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <MaterialTable
                            icons={tableIcons}
                            isLoading={itemsLoad}
                            columns={[
                                { title: "Item Name", field: "name", editable: "never" },
                                {
                                    title: "Quantity", field: "quantity", type: "numeric", editable: "always",
                                    render: (rowData) => <><strong>{rowData.quantity}</strong> {rowData.unit >= 0 ? rowData.units[rowData.unit].name.split(" ").map((c: string) => c.charAt(0)).join("").toUpperCase() : ""}</>
                                },
                                { title: "Amount", field: "amount", type: "numeric", editable: "never" },
                                { title: "Rate", field: "rate", type: "numeric", editable: "never" },
                            ]}
                            data={items}
                            options={{
                                search: false,
                                paging: false,
                                toolbar: false,
                                actionsColumnIndex: -1,
                                padding: "dense"
                            }}
                            editable={{
                                onRowUpdate: (newData, oldData) => new Promise<void>((res, rej) => {
                                    updateQuantity(newData.id, newData.quantity, newData.unit)
                                    res();
                                })
                            }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Discount Percentage"
                            type="number"
                            fullWidth
                            variant="outlined"
                            onFocus={event => { setDiscountAmount(0); event.target.select(); }}
                            onChange={(event) => setDiscountPercentage(parseFloat(event.target.value))}
                            value={discountPercentage}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Discount Amount"
                            type="number"
                            fullWidth
                            variant="outlined"
                            onFocus={event => { setDiscountPercentage(0); event.target.select(); }}
                            onChange={(event) => setDiscountAmount(parseFloat(event.target.value))}
                            value={discountAmount}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            value={billAmount}
                            label="Total Amount"
                            InputProps={{
                                readOnly: true
                            }}
                            type="number"
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={credit}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCredit(event.target.checked)}
                                    name="credit"
                                    color="primary"
                                />
                            }
                            label="Credit Amount"
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            value={paidAmount}
                            label="Paid Amount"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPaidAmount(parseFloat(event.target.value))}
                            type="number"
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button variant="contained" disabled={billSaveLoad} onClick={() => saveBill().then(closeModal)} color="primary">
                            Save Bill
                        </Button>
                        <Zoom in={billSaveLoad}><CircularProgress /></Zoom>
                    </Grid>
                </Grid>
                <NewCustomerCreationModal visible={customerModal.visible} onClose={closeCustomerModal} onCreate={closeCustomerModal} />
            </form>
        );
    }
}


const mapStateToProps = (state: any): StateProps => {
    return {
        customerSuggestions: state.customer.customerSuggestions,
        customer: state.bill.customer,
        itemSuggestions: state.item.itemSuggestions,
        items: state.bill.items,
        itemsLoad: state.bill.itemsLoad,
        discountAmount: state.bill.discountAmount,
        discountPercentage: state.bill.discountPercentage,
        itemsTotalAmount: getItemsTotalAmount(state.bill),
        billAmount: getBillAmount(state.bill),
        paidAmount: state.bill.paidAmount,
        credit: state.bill.credit,
        billSaveLoad: state.bill.billSaveLoad
    }
};

const mapDispatchToProps = (dispatch: ThunkDispatch<{}, {}, any>): DispatchProps => ({
    getCustomerSuggestions: (phrase: string) => dispatch(fetchCustomerSuggestions(phrase)),
    getItemSuggestions: (code: string) => dispatch(fetchItemSuggesions(code)),
    setCustomer: (id: string) => dispatch(setCustomerAction(id)),
    addItem: (id: string, quantity: number, unit: number) => dispatch(addItem(id, quantity, unit)),
    setDiscountAmount: (amount) => dispatch({ type: "BILL_SET_DISCOUNT", payload: amount }),
    setDiscountPercentage: (percentage) => dispatch({ type: "BILL_SET_DISCOUNT_PERCENTAGE", payload: percentage }),
    updateQuantity: (id, newQuantity, unit) => dispatch({ type: "BILL_ITEM_QUANTITY_UPDATE", payload: [id, newQuantity, unit] }),
    setCredit: (isCredit: boolean) => dispatch({ type: "BILL_SET_CREDIT", payload: isCredit }),
    setPaidAmount: (paidAmount: number) => dispatch({ type: "BILL_PAID_AMOUNT", payload: paidAmount }),
    saveBill: () => dispatch(saveBill())
});


export default connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(NewBillForm);