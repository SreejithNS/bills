import { configure } from 'axios-hooks'
import Axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { Query } from 'material-table';
import { setupCache } from 'axios-cache-adapter'
import localforage from 'localforage'

export interface APIResponse<Data> {
    status: number;
    message: string;
    data?: Data;
}

const MAX_REQUESTS_COUNT = 5
const INTERVAL_MS = 10
let PENDING_REQUESTS = 0

const forageStore = localforage.createInstance({
    // List of drivers used
    driver: [
        localforage.INDEXEDDB,
        localforage.LOCALSTORAGE,
    ],

    // Prefix all storage keys to prevent conflicts
    name: 'billzapp-api'
})

// Create `axios-cache-adapter` instance
// const cache = setupCache({
//     maxAge: 60 * 1000, // 
//     store: forageStore,
//     exclude: {
//         query: false,
//     }
// })

const axios = Axios.create({
    baseURL: process.env.REACT_APP_API_URL + '/api',
    withCredentials: true,
    //adapter: cache.adapter
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

export function handleAxiosError<T>(errorResponse: AxiosError<APIResponse<T>>, callback?: ((error: AxiosError<APIResponse<T>>) => void) | undefined): void {
    if (process.env.NODE_ENV === "development") console.error(errorResponse);
    if (errorResponse.response) {
        if (errorResponse.response.status === 401) { // Unauthorised Response
            toast.warn("You will be Session will be revoked");
            // axios.post("/auth/logout").finally(
            //     () => {
            //if not in login page then redirect to login page
            if (window.location.pathname !== "/login") window.location.href = "/login";
            //     }
            // )
        } else if (errorResponse.response.status === 400) {
            const data = errorResponse.response.data.data;
            if (Array.isArray(data)) {
                for (let valError of data) {
                    valError.msg && toast.warn(valError.msg);
                }
            }
        } else
            // Request made and server responded
            toast.error(errorResponse.response.data.message || errorResponse.response.statusText || "Error! Please try again later");
    } else if (errorResponse.request) {
        // The request was made but no response was received
        // Something happened in setting up the request that triggered an Error
        toast.error(errorResponse.message);
    }
    if (callback) callback(errorResponse);
}

export function loginPost(url: URL, params: any, method = 'post') {

    // The rest of this code assumes you are not using a library.
    // It can be made less verbose if you use one.
    const form = document.createElement('form');
    form.method = method;
    form.action = url.toString();

    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = params[key];
            form.appendChild(hiddenField);
        }
    }
    document.body.appendChild(form);
    form.submit();
}

export {
    axios,
    interpretMTQuery
};
export default initAxios;