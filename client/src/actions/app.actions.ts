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
                    payload: response.data,
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
