import axios from "axios";
import { toast } from "react-toastify"

interface BillData extends Object {
    customerId: string,
    discountAmount: number,
    items: { id: string; quantity: number; }[];
    credit: boolean;
    paidAmount: number;
}

export const fetchbill = (id: string, fallBack?: any) => {
    return (dispatch: any, getState: any) => {
        dispatch({ type: "BILL_DATA_LOAD", payload: true });
        const { billsList } = getState().bill;
        const bill = billsList.filter((billThat: { _id: string; }) => billThat._id === id);
        if (bill.length > 0) {
            dispatch({ type: "BILL_DATA", payload: bill[0] });
            dispatch({ type: "BILL_DATA_LOAD", payload: false })
        } else {
            axios
                .get(process.env.REACT_APP_API_URL + "/api/bill/" + id, { withCredentials: true })
                .then(response => {
                    dispatch({ type: "BILL_DATA", payload: response.data.data });
                })
                .catch(error => { toast.error("Bill Fetching Error:" + error.message); fallBack && fallBack() })
                .finally(() => dispatch({ type: "BILL_DATA_LOAD", payload: false }))
        }
    }
}

export const saveBill = () => {
    return (dispatch: any, getState: any) => {
        dispatch({ type: "BILL_SAVE_LOAD", payload: true });
        const billData: BillData = { customerId: "", discountAmount: 0, items: [], credit: true, paidAmount: 0 };
        const { customer, items, discountAmount, credit, paidAmount } = getState().bill;
        billData.customerId = customer.id;
        billData.discountAmount = discountAmount;
        billData.items = items.map((item: { id: string; quantity: number; }, key: number) => ({ id: item.id, quantity: item.quantity }));
        billData.credit = credit;
        billData.paidAmount = paidAmount;
        return axios
            .post(process.env.REACT_APP_API_URL + "/api/bill", billData, { withCredentials: true })
            .catch(error => toast.error("Bill Save Error:" + error.message))
            .finally(() => dispatch({ type: "BILL_SAVE_LOAD", payload: false }))
    }
}

export const postReceivePayment = (id: string, amount: number) => {
    return (dispatch: any, getState: any) => {
        return axios
            .post(process.env.REACT_APP_API_URL + "/api/bill/payment", { bill: id, paidAmount: amount }, { withCredentials: true })
            .catch(error => toast.error("Bill Payment Receive Error:" + error.message))
            .finally(() => {
                toast.success("Payment Updated!");
                fetchbill(id)(dispatch, getState);
            });
    }
}

export const putBillCredit = (id: string) => {
    return (dispatch: any, getState: any) => {
        return axios
            .put(process.env.REACT_APP_API_URL + "/api/bill/toggleCredit", { bill: id }, { withCredentials: true })
            .catch(error => toast.error("Bill Credit Change:" + error.message))
            .finally(() => {
                toast.success("Bill open payments!");
                fetchbill(id)(dispatch, getState);
            });
    }
}



export const fetchBillList = (extraBills?: boolean) => {
    return (dispatch: any, getState: any) => {
        if (getState().bill.billsList.length === 0 || extraBills) {
            dispatch({ type: "FETCH_BILLS_LIST_LOAD", payload: true });

            const queryString = new URL(process.env.REACT_APP_API_URL + "/api/bill/query/");

            queryString.searchParams.append("offset", getState().bill.billsList.length);
            queryString.searchParams.append("sort", "-createdAt");

            axios
                .get(queryString.toString(), { withCredentials: true })
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
        }
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