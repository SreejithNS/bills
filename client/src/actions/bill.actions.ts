import axios from "axios";
import { toast } from "react-toastify"

interface BillData extends Object {
    customerId: string,
    discountAmount: number,
    items: { id: string; quantity: number; }[];
}

export const saveBill = () => {
    return (dispatch: any, getState: any) => {
        dispatch({ type: "BILL_SAVE_LOAD", payload: true });
        const billData: BillData = { customerId: "", discountAmount: 0, items: [] };
        const { customer, items, discountAmount } = getState().bill;
        billData.customerId = customer.id;
        billData.discountAmount = discountAmount;
        billData.items = items.map((item: { id: string; quantity: number; }, key: number) => ({ id: item.id, quantity: item.quantity }));

        return axios
            .post(process.env.REACT_APP_API_URL + "/api/bill", billData, { withCredentials: true })
            .catch(error => toast.error("Bill Save Error:" + error.message))
            .finally(() => dispatch({ type: "BILL_SAVE_LOAD", payload: false }))
    }
}


export const fetchBillList = () => {
    return (dispatch: any) => {
        dispatch({ type: "FETCH_BILLS_LIST_LOAD", payload: true });
        axios
            .get(process.env.REACT_APP_API_URL + "/api/bill/", { withCredentials: true })
            .then(function (response) {
                dispatch({
                    type: "FETCH_BILLS_LIST",
                    payload: response.data.data,
                });
            })
            .catch(function (error) {
                dispatch({
                    type: "FETCH_BILLS_LIST_ERROR",
                    payload: error,
                });
                toast.error("Bills List Error:" + error.message)
            })
            .finally(function () {
                dispatch({ type: "FETCH_BILLS_LIST_LOAD", payload: false });
            });
    };
};

export const fetchCustomerList = () => {
    return (dispatch: any) => {
        axios
            .get(process.env.REACT_APP_API_URL + "/api/customer/", { withCredentials: true })
            .then(function (response) {
                dispatch({
                    type: "FETCH_CUSTOMERS_LIST",
                    payload: response.data.data,
                });
            })
            .catch(function (error) {
                dispatch({
                    type: "FETCH_CUSTOMERS_LIST_ERROR",
                    payload: error,
                });
                console.error(error);
                toast.error("Customer List: " + error.message);
            })
            .finally(function () {
                dispatch({ type: "FETCH_CUSTOMERS_LIST_LOAD", payload: false });
            });
    };
};

export const setCustomer = (id: string) => {
    return (dispatch: any) => {
        console.log("Action Initiated")
        dispatch({
            type: "BILL_CUSTOMER_LOAD",
            payload: true,
        });
        axios
            .get(process.env.REACT_APP_API_URL + "/api/customer/" + id, { withCredentials: true })
            .then(function (response) {
                dispatch({
                    type: "BILL_ADD_CUSTOMER",
                    payload: response.data.data,
                });
            })
            .catch(function (error) {
                toast.error("Customer error:" + error.message);
            })
            .finally(function () {
                dispatch({
                    type: "BILL_CUSTOMER_LOAD",
                    payload: false,
                });
            });
    }
}
export const addItem = (id: string, quantity: number) => {
    return (dispatch: any) => {
        console.log("Action Initiated")
        dispatch({
            type: "BILL_ADD_ITEM_LOAD",
            payload: true,
        });
        axios
            .get(process.env.REACT_APP_API_URL + "/api/product/" + id, { withCredentials: true })
            .then(function (response) {
                const item = response.data.data;
                item.quantity = quantity;
                dispatch({
                    type: "BILL_ADD_ITEM",
                    payload: item,
                });
            })
            .catch(function (error) {
                toast.error("Add Item error:" + error.message);
            })
            .finally(function () {
                dispatch({
                    type: "BILL_ADD_ITEM_LOAD",
                    payload: false,
                });
            });
    }
}