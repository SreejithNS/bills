import { SubmissionError } from 'redux-form';
import axios from "axios";
import { toast } from "react-toastify"

export const fetchItemSuggesions = (code: string) => {
    return (dispatch: any) => {
        if (code.length > 0) axios
            .get(process.env.REACT_APP_API_URL + `/api/product/suggestions/${code}`, { withCredentials: true })
            .then(function (response) {
                dispatch({
                    type: "ITEM_SUGGESTIONS",
                    payload: response.data.data,
                });
            })
            .catch(function (error) {
                toast.error("Couldn't get Suggestions:" + error.message);
            })
    };
};


export const itemCodeExists = (code: string) => code.length ? axios
    .get(process.env.REACT_APP_API_URL + `/api/product/availability/${code}`, { withCredentials: true })
    .then(function (response) {
        return response.data.data
    })
    .catch(function (error) {
        toast.error("Couldn't get item code validation:" + error.message);
    }) : false

export const addItem = (details: any) => {
    return axios
        .post(process.env.REACT_APP_API_URL + `/api/product/`, details, { withCredentials: true })
        .catch(function (error) {
            toast.error("Couldn't add item:" + error.message);
            throw new SubmissionError({});
        })
};

export const fetchItemsList = (extraItems?: boolean) => {
    return (dispatch: any, getState: any) => {
        if (getState().item.itemsList.length === 0 || extraItems) {
            dispatch({ type: "FETCH_ITEMS_LIST_LOAD", payload: true });

            const queryString = new URL(process.env.REACT_APP_API_URL + "/api/product/query/");

            queryString.searchParams.append("offset", getState().item.itemsList.length);
            queryString.searchParams.append("sort", "-createdAt");

            axios
                .get(queryString.toString(), { withCredentials: true })
                .then(function (response) {
                    dispatch({
                        type: "FETCH_ITEMS_LIST",
                        payload: response.data.data,
                    });
                })
                .catch(function (error) {
                    dispatch({
                        type: "FETCH_ITEMS_LIST_ERROR",
                        payload: error,
                    });
                    toast.error("Items List Error:" + error.message)
                })
                .finally(function () {
                    dispatch({ type: "FETCH_ITEMS_LIST_LOAD", payload: false });
                });
        }
    };
};