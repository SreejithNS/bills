import { SubmissionError } from 'redux-form';
import axios from "axios";
import { toast } from "react-toastify"

export const fetchCustomerSuggestions = (phrase: string) => {
  return (dispatch: any) => {
    if (phrase.length > 0) axios
      .get(process.env.REACT_APP_API_URL + `/api/customer/suggestions/${phrase}`, { withCredentials: true })
      .then(function (response) {
        dispatch({
          type: "CUSTOMER_SUGGESTIONS",
          payload: response.data.data,
        });
      })
      .catch(function (error) {
        toast.error("Couldn't get Suggestions:" + error.message);
      })
  };

};

export const addCustomer = (details: any) => {
  return axios
    .post(process.env.REACT_APP_API_URL + `/api/customer/`, details, { withCredentials: true })
    .catch(function (error) {
      toast.error("Couldn't add customer:" + error.message);
      throw new SubmissionError({});
    })
};

export const deleteCustomer = (id: string) => {
  return (dispatch: any) => {
    axios
      .delete(process.env.REACT_APP_API_URL + `/api/customer/${id}`, { withCredentials: true })
      .then(() => {
        fetchCustomerList()(dispatch)
        toast.success("Customer deleted!")
      })
      .catch(function (error) {
        toast.error("customer:" + error.message);
      })
  }
};

export const fetchCustomerList = () => {
  return (dispatch: any) => {
    dispatch({ type: "FETCH_CUSTOMERS_LIST_LOAD", payload: true });
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
        toast.error("Customer List Error:" + error.message)
      })
      .then(function () {
        dispatch({ type: "FETCH_CUSTOMERS_LIST_LOAD", payload: false });
      });
  };
};