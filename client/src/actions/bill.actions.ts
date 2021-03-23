import axios from "axios";
import { toast } from "react-toastify"

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



export const fetchBillList = (extraBills?: boolean, queryParams?: any) => {
    return (dispatch: any, getState: any) => {
        if (getState().bill.billsList.length === 0 || extraBills) {
            dispatch({ type: "FETCH_BILLS_LIST_LOAD", payload: true });

            const queryString = new URL(process.env.REACT_APP_API_URL + "/api/bill/query/");

            if (queryParams)
                for (const [key, value] of Object.entries<string>(queryParams)) {
                    queryString.searchParams.append(key, value);
                }
            else {
                queryString.searchParams.append("offset", getState().bill.billsList.length);
                queryString.searchParams.append("sort", "-createdAt");
            }

            return axios
                .get(queryString.toString(), { withCredentials: true })
                .then(function (response) {
                    dispatch({
                        type: "FETCH_BILLS_LIST",
                        payload: response.data.data,
                    });
                    return response.data.data
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