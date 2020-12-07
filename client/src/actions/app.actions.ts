import axios from "axios";
import { toast } from "react-toastify"

export const fetchUserData = () => {
    return (dispatch: any) => {
        dispatch({ type: "USER_DATA_LOAD", payload: true });
        axios
            .get(process.env.REACT_APP_API_URL + `/api/auth/`, { withCredentials: true })
            .then(function (response) {
                dispatch({
                    type: "USER_DATA",
                    payload: response.data.data,
                });
            })
            .catch(function (error) {
                toast.error("App Could'nt load" + error.message);
                dispatch({
                    type: "USER_DATA_ERROR",
                    payload: { error: true, message: error.message },
                });
            })
            .finally(() => dispatch({ type: "USER_DATA_LOAD", payload: false }))
    };
};

export const getSalesmenList = () => {
    return (dispatch: any) => {
        dispatch({ type: "SALESMEN_LIST_LOAD", payload: true });
        axios
            .get(process.env.REACT_APP_API_URL + `/api/auth/salesmen`, { withCredentials: true })
            .then(function (response) {
                dispatch({
                    type: "SALESMEN_LIST",
                    payload: response.data.data,
                });
            })
            .catch(function (error) {
                toast.error("Could not GET salesman list:" + error.message);
            })
            .finally(() => dispatch({ type: "SALESMEN_LIST_LOAD", payload: false }))
    };
};

export const postNewSalesman = (newSalesmanData: any) => {
    return (dispatch: any) => {
        dispatch({ type: "ADD_NEW_SALESMAN_LOAD", payload: true });
        return axios
            .post(process.env.REACT_APP_API_URL + `/api/auth/registerSalesman`, newSalesmanData, { withCredentials: true })
            .then(function (response) {
                toast.success("New Salesman Added");
                getSalesmenList()(dispatch);
            })
            .catch(function (error) {
                toast.error("Could not add salesman:" + error.message);
            })
            .finally(() => dispatch({ type: "ADD_NEW_SALESMAN_LOAD", payload: false }))
    };
};

export const putSalesmanPassword = (newSalesmanPassword: any) => {
    return (dispatch: any) => {
        dispatch({ type: "MODIFY_SALESMAN_PASSWORD_LOAD", payload: true });
        axios
            .put(process.env.REACT_APP_API_URL + `/api/auth/salesmanPassword`, newSalesmanPassword, { withCredentials: true })
            .then(function (response) {
                toast.success("Salesman password updated");
            })
            .catch(function (error) {
                toast.error("Could not update salesman:" + error.message);
            })
            .finally(() => dispatch({ type: "MODIFY_SALESMAN_PASSWORD_LOAD", payload: false }))
    };
};

export const checkPhoneNumberExists = (phoneNumber: any) => {
    return axios
        .get(process.env.REACT_APP_API_URL + `/api/auth/salesman/numberAvailability/${phoneNumber}`, { withCredentials: true })
        .then(res => res.data.data, err => err);
}