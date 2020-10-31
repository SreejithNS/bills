import axios from 'axios';

export const fetchCustomerList = () => {
    return (dispatch, getState) => {
        dispatch({ type: "FETCH_CUSTOMERS_LIST_LOAD" });
        axios.get('https://jsonplaceholder.typicode.com/todos/1')
        .then(function (response) {
            // handle success
            console.log(response);
          })
          .catch(function (error) {
            // handle error
            console.log(error);
          })
          .then(function () {
            // always executed
          });
    }
}