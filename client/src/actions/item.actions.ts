import { APIResponse, handleAxiosError } from './../components/Axios/index';
import { SubmissionError } from 'redux-form';
import { toast } from "react-toastify"
import { ProductCategory } from '../reducers/product.reducer';
import { axios } from '../components/Axios';
import { UserData } from '../reducers/auth.reducer';

export const createProductCategory = (name: ProductCategory["name"], hasAccess?: UserData["_id"][]): Promise<{ _id: ProductCategory["_id"] }> => {
    return new Promise((res, rej) => {
        axios
            .post<APIResponse<{ _id: ProductCategory["_id"] }>>("/category", {
                name, ...(hasAccess && { hasAccess })
            })
            .then(response => response.data.data ? res(response.data.data) : rej("New Product ID not returned"))
            .catch(handleAxiosError);
    })
}

export const fetchItemSuggesions = (code: string) => {
    return (dispatch: any, getState: any) => {
        const { itemCategory } = getState().item;
        if (code.length > 0) axios
            .get(process.env.REACT_APP_API_URL + `/api/product/suggestions/${itemCategory}.${code}`, { withCredentials: true })
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


export const itemCodeExists = (category: string, code: string) => code.length ? axios
    .get(process.env.REACT_APP_API_URL + `/api/product/availability/${category}.${code}`, { withCredentials: true })
    .then(function (response) {
        return response.data.data
    })
    .catch(function (error) {
        toast.error("Couldn't get item code validation:" + error.message);
    }) : false

export const addItem = (details: any, itemCategory: string) => {
    return axios
        .post(process.env.REACT_APP_API_URL + `/api/product/${itemCategory}`, details, { withCredentials: true })
        .catch(function (error) {
            toast.error("Couldn't add item:" + error.message);
            throw new SubmissionError({});
        })
};

export const fetchItemsList = (extraItems?: boolean) => {
    return (dispatch: any, getState: any) => {
        if (getState().item.itemsList.length === 0 || extraItems) {
            dispatch({ type: "FETCH_ITEMS_LIST_LOAD", payload: true });

            const queryString = new URL(process.env.REACT_APP_API_URL + "/api/product/query");

            queryString.searchParams.append("offset", getState().item.itemsList.length);
            queryString.searchParams.append("sort", "-createdAt");
            queryString.searchParams.append("category", getState().item.itemCategory);

            axios
                .get(queryString.toString(), { withCredentials: true })
                .then(function (response) {
                    dispatch({
                        type: "FETCH_ITEMS_LIST",
                        payload: response.data.data,
                    });
                })
                .catch(function (error) {
                    dispatch({
                        type: "FETCH_ITEMS_LIST_ERROR",
                        payload: error,
                    });
                    toast.error("Items List Error:" + error.message)
                })
                .finally(function () {
                    dispatch({ type: "FETCH_ITEMS_LIST_LOAD", payload: false });
                });
        }
    };
};

export const parseCsvItemsArray = (csvArray: any[][]) => {
    const unitSchemaValidator = function (rate: number, mrp: number, units: any[]) {
        if (!units || !Array.isArray(units))
            throw new TypeError("Unit is not an array");

        return units.map((unit) => {
            try {
                if (!Object.keys(unit).includes("name"))
                    throw new TypeError("Unit doesn't have a name");
                else if (
                    !(typeof unit.name === "string" || unit.name instanceof String)
                )
                    throw new TypeError("Unit name is not a string");

                unit["name"] = unit["name"].trim().toLowerCase();

                if (!Object.keys(unit).includes("rate") || unit["rate"] === null) unit["rate"] = rate;
                if (!Object.keys(unit).includes("mrp") || unit["mrp"] === null) unit["mrp"] = mrp;

                return unit;
            } catch (e) {
                console.error("Unit Error:" + e.message);
                console.warn("Marking this unit for Removal", unit);
                return undefined;
            }
        })
            .filter(element => element !== undefined)
    };

    return csvArray.map((item: any[]) => {
        //Create item Object by splicing first 4 elements as name,code,rate,mrp
        const itemObject = {
            name: item.shift(),
            code: item.shift(),
            primaryUnit: item.shift(),
            rate: item.shift(),
            mrp: item.shift(),
            units: item
        };

        //divide units array into chunks of 3 elements
        itemObject.units = new Array(Math.ceil(itemObject.units.length / 3))
            .fill(null)
            .map(_ => itemObject.units.splice(0, 3))

        //create unit object for each chunk
        itemObject.units = itemObject.units.map(unit => ({
            name: unit.shift(),
            rate: unit.shift(),
            mrp: unit.shift(),
        }))

        //validate array of unit objects
        itemObject.units = unitSchemaValidator(itemObject.rate, itemObject.mrp, itemObject.units)

        return itemObject;
    })
}

/**
 * Converts array of Items to Flat 2D array for csv exports
 * @param items {[Items]} - array of Items
 */
export const itemsArrayToCsvArray = (items: any[]) => items.map(
    ({ name, code, mrp, rate, units }) =>
        [name, code, rate, mrp, ...units.map(
            ({ name, rate, mrp }: { name: string; rate: number; mrp: number }) => [name, rate, mrp]).flat()
        ]
)

/**
 * Exports 2D array to csv file.
 * @param filename {string} - Filename without extension
 * @param rows {any[][]} - 2D Flat array without objects
 */
export const exportToCsv = (filename: string, rows: any[][]) => {
    var processRow = function (row: any[][]) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename + ".csv");
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename + ".csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}