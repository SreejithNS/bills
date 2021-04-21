import { APIResponse, axios } from './../components/Axios/index';

export const checkPhoneNumberExists = (phoneNumber: any) => {
    return axios
        .get<APIResponse<boolean>>(`/auth/register/${phoneNumber}/availability`)
        .then(res => res.data?.data, err => err);
}