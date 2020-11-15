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