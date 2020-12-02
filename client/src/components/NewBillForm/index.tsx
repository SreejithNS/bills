import React from "react";
import TextField from "@material-ui/core/TextField";
import { Button, Checkbox, CircularProgress, FormControlLabel, Grid, Zoom } from "@material-ui/core";
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
    addItem(id: string, quantity: number): void;
    updateQuantity(id: string, newQuantity: number): void;
    setCredit(isCredit: boolean): void;
    setPaidAmount(paidAmount: number): void;
    saveBill(): void;
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


class NewBillForm extends React.Component<StateProps & DispatchProps> {
    state = {
        customerModal: {
            name: "",
            visible: false
        },
        item: {
            id: "",
            code: "",
            name: "",
            quantity: 0
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
        const value = parseInt(event.target.value);
        this.setState(prevState => {
            const newState: any = { ...prevState };
            newState.item.quantity = value;
            return newState;
        });
    }

    handleAddItem = (event: any) => {
        const { id, quantity } = this.state.item;
        if (id === "") {
            toast.error("Please select and Item");
        } else if (quantity <= 0) {
            toast.error("Please enter a valid quantity");
        } else {
            this.props.addItem(id, quantity);
        }
    }

    render() {
        const { customer, customerSuggestions, itemSuggestions, items, billAmount, discountAmount, itemsLoad, discountPercentage, billSaveLoad, credit, paidAmount, setCredit, setPaidAmount, saveBill, setDiscountPercentage, updateQuantity, setDiscountAmount, getCustomerSuggestions, getItemSuggestions } = this.props;
        const { customerModal, item } = this.state;
        const { openCustomerModal, closeCustomerModal, handleCustomerChange, handleItemCodeChange, handleItemQuantityChange, handleAddItem } = this;

        return (
            <form>
                <Grid
                    container
                    direction="row"
                    justify="space-between"
                    alignItems="flex-start"
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
                    <Grid item xs={5}>
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
                    <Grid item xs={4}>
                        <TextField label="Quantity" type="number" fullWidth onFocus={(event) => { event.target.select() }} value={item.quantity || 0} onChange={handleItemQuantityChange} variant="outlined" />
                    </Grid>
                    <Grid item xs={3}>
                        <Button variant="contained" color="primary" onClick={handleAddItem}>
                            Add Item
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <MaterialTable
                            icons={tableIcons}
                            isLoading={itemsLoad}
                            columns={[
                                { title: "Item Name", field: "name", editable: "never" },
                                { title: "Quantity", field: "quantity", type: "numeric", editable: "always" },
                                { title: "Rate", field: "rate", type: "numeric", editable: "never" },
                                { title: "Amount", field: "amount", type: "numeric", editable: "never" }
                            ]}
                            data={items}
                            options={{
                                search: false,
                                paging: false,
                                toolbar: false,
                                padding: "dense"
                            }}
                            editable={{
                                onRowUpdate: (newData, oldData) => new Promise((res, rej) => {
                                    updateQuantity(newData.id, newData.quantity)
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
                        {/* <TextField
                            value={billAmount}
                            label="Total Amount"
                            InputProps={{
                                readOnly: true
                            }}
                            type="radio"
                            variant="outlined"
                        /> */}
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
                        <Button variant="contained" disabled={billSaveLoad} onClick={saveBill} color="primary">
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
    addItem: (id: string, quantity: number) => dispatch(addItem(id, quantity)),
    setDiscountAmount: (amount) => dispatch({ type: "BILL_SET_DISCOUNT", payload: amount }),
    setDiscountPercentage: (percentage) => dispatch({ type: "BILL_SET_DISCOUNT_PERCENTAGE", payload: percentage }),
    updateQuantity: (id, newQuantity) => dispatch({ type: "BILL_ITEM_QUANTITY_UPDATE", payload: [id, newQuantity] }),
    setCredit: (isCredit: boolean) => dispatch({ type: "BILL_SET_CREDIT", payload: isCredit }),
    setPaidAmount: (paidAmount: number) => dispatch({ type: "BILL_PAID_AMOUNT", payload: paidAmount }),
    saveBill: () => dispatch(saveBill())
});


export default connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(NewBillForm);