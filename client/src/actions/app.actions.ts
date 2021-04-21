import { APIResponse } from './../components/Axios/index';
import axios from "axios";

export const checkPhoneNumberExists = (phoneNumber: any) => {
    return axios
        .get<APIResponse<boolean>>(`/auth/register/${phoneNumber}/availability`)
        .then(res => res.data?.data, err => err);
}