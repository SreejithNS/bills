import axios from "axios";

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
      })
      .then(function () {
        dispatch({ type: "FETCH_CUSTOMERS_LIST_LOAD", payload: false });
      });
  };
};
