import { configure } from 'axios-hooks'
import Axios, { AxiosError } from 'axios'
import { toast } from 'react-toastify';
import { Query } from 'material-table';
import { LibraryMusicTwoTone, Search } from '@material-ui/icons';

export interface APIResponse<Data> {
    status: number;
    message: string;
    data?: Data;
}

export function handleAxiosError<T>(errorResponse: AxiosError<APIResponse<T>>, callback?: ((error: AxiosError<APIResponse<T>>) => void) | undefined): void {
    if (errorResponse.response) {
        // Request made and server responded
        toast.error(errorResponse.response.data.message);
    } else if (errorResponse.request) {
        // The request was made but no response was received
        // Something happened in setting up the request that triggered an Error
        toast.error(errorResponse.message);
    }
    if (callback) callback(errorResponse);
}

const axios = Axios.create({
    baseURL: process.env.REACT_APP_API_URL + '/api',
    withCredentials: true,
})

const initAxios = () => configure({ axios });

const interpretMTQuery = <T extends object>(query: Query<T>): Record<string, string> => {
    const orderDirection = query.orderDirection === "desc" ? "-" : "";

    const interpreted = {
        page: query.page + 1,
        limit: query.pageSize,
        offset: 0,
        search: query.search,
        ...(query.orderBy && { sort: orderDirection + query.orderBy })
    }

    return Object.fromEntries(Object.entries(interpreted).map(e => e.map(f => f.toString())))
}

export { axios, interpretMTQuery };
export default initAxios;