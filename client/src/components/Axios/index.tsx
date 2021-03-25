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
    if (process.env.NODE_ENV === "development") console.error(errorResponse);
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

const MAX_REQUESTS_COUNT = 5
const INTERVAL_MS = 10
let PENDING_REQUESTS = 0

const axios = Axios.create({
    baseURL: process.env.REACT_APP_API_URL + '/api',
    withCredentials: true,
})

/**
 * Axios Request Interceptor
 */
axios.interceptors.request.use(function (config) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            if (PENDING_REQUESTS < MAX_REQUESTS_COUNT) {
                PENDING_REQUESTS++
                clearInterval(interval)
                resolve(config)
            }
        }, INTERVAL_MS)
    })
})

/**
 * Axios Response Interceptor
 */
axios.interceptors.response.use(function (response) {
    PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1)
    return Promise.resolve(response)
}, function (error) {
    PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1)
    return Promise.reject(error)
})

const initAxios = () => configure({ axios });

const interpretMTQuery = <T extends object>(query: Query<T>): Record<string, string> => {
    const orderDirection = query.orderDirection === "desc" ? "-" : "";

    const interpreted = {
        page: query.page + 1,
        limit: query.pageSize,
        offset: 0,
        search: query.search,
        ...(query.orderBy && { sort: orderDirection + query.orderBy.field })
    }
    return Object.fromEntries(Object.entries(interpreted).map(e => e.map(f => f.toString())))
}

export { axios, interpretMTQuery };
export default initAxios;