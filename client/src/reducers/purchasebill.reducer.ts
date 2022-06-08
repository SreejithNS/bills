import { BillData } from './bill.reducer';
import { UserData } from "./auth.reducer";
import { Customer } from "./customer.reducer";
import { Product, Unit } from "./product.reducer";

export interface PurchaseBillItem extends Product {
    unit?: Unit;
    quantity: number;
    amount: number;
    instock: number;
}

export interface PaginateResult<T> {
    docs: T[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    nextPage?: number | null;
    prevPage?: number | null;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    meta?: any;
}

export interface PurchaseBillState {
    contact: Customer | null;
    items: PurchaseBillItem[];
    discountAmount: number;
    discountPercentage: number;
    billSaved: boolean;
    paidAmount: number;
    credit: boolean;
    location: null | [GeolocationCoordinates["longitude"], GeolocationCoordinates["latitude"]]
}

export interface BillPayments {
    paymentReceivedBy: UserData;
    paidAmount: number;
    createdAt: Date;
}

export interface PurchaseBillSales {
    bill: BillData;
    items: { code: string, quantity: number, amount: number }[];
}


export interface PurchaseBillData {
    _id: string;
    serialNumber: number;
    contact: Customer;
    category: Product["category"];
    soldBy: UserData;
    belongsTo: UserData;
    items: PurchaseBillItem[];
    discountAmount: number;
    itemsTotalAmount: number;
    billAmount: number;
    credit: boolean;
    paidAmount: number;
    payments: BillPayments[];
    createdAt: Date;
    sales: PurchaseBillSales[];
    location?: {
        type: "Point";
        coordinates: [number, number]
    }
}

const initialState: PurchaseBillState = {
    contact: null,
    items: [],
    discountAmount: 0,
    discountPercentage: 0,
    billSaved: false,
    paidAmount: 0,
    credit: false,
    location: null,
};

export interface PurchaseBillPostData extends Object {
    contact: Customer["_id"],
    category: string,
    discountAmount: PurchaseBillState["discountAmount"],
    items: { _id: PurchaseBillItem["_id"]; quantity: PurchaseBillItem["quantity"]; unit?: Unit["name"] }[];
    credit: PurchaseBillState["credit"];
    paidAmount: PurchaseBillState["paidAmount"];
    location?: {
        lon: GeolocationCoordinates["longitude"],
        lat: GeolocationCoordinates["latitude"]
    }
}

export const getItemsTotalAmount = (billState: PurchaseBillState) => {
    var sum = 0;
    billState.items.forEach((item) => {
        sum += item.amount;
    });
    return sum;
};

export const getBillAmount = (billState: PurchaseBillState) => {
    return Math.round(getItemsTotalAmount(billState) - billState.discountAmount);
};

const calculateItemAmounts = (billState: PurchaseBillState) => {
    billState.items.forEach((item) => {
        if (item.unit) item.amount = item.quantity * item.unit.cost;
        else item.amount = item.quantity * item.cost;
    });
    if (!billState.credit) {
        billState.paidAmount = getBillAmount(billState);
    }
    return billState;
};

const setDiscountAmountFromPercentage = (billState: PurchaseBillState) => {
    const itemsTotalAmount = getItemsTotalAmount(billState);
    const discountPercentage = billState.discountPercentage;
    const discountAmount = (discountPercentage * itemsTotalAmount) / 100
    if (discountAmount > getItemsTotalAmount(billState)) return { ...billState };
    else return calculateItemAmounts({
        ...billState,
        discountAmount
    });
};

const setPercentageFromDiscountAmount = (billState: PurchaseBillState) => {
    const itemsTotalAmount = getItemsTotalAmount(billState);
    const discountAmount = billState.discountAmount;
    const discountPercentage = (discountAmount / itemsTotalAmount) * 100;
    return calculateItemAmounts({
        ...billState,
        discountPercentage: parseFloat(discountPercentage.toFixed(2)),
    });
};

export default function purchaseBillReducer(state: PurchaseBillState = initialState, action: { type: string; payload: any }): PurchaseBillState {
    switch (action.type) {
        case "PURCHASE_BILL_SET_CUSTOMER": {
            return {
                ...state,
                contact: action.payload,
            };
        }
        case "PURCHASE_BILL_SET_DISCOUNT": {
            const payload = Math.abs(action.payload);
            if (payload > getItemsTotalAmount(state)) return state;
            return setPercentageFromDiscountAmount({
                ...state,
                discountAmount: payload
            });
        }
        case "PURCHASE_BILL_SET_DISCOUNT_PERCENTAGE": {
            const payload = Math.abs(action.payload);
            return setDiscountAmountFromPercentage({
                ...state,
                discountPercentage: payload,
            });
        }
        case "PURCHASE_BILL_ADD_ITEM": {
            const items = [...state.items];
            let payload = action.payload as PurchaseBillItem;
            const index = items.findIndex(
                (item) =>
                    item._id === payload._id &&
                    item.unit?._id === payload.unit?._id
            );
            if (index >= 0) {
                items[index].quantity += payload.quantity;
            } else {
                if (payload.unit) {
                    payload.rate = payload.unit.cost;
                    payload.mrp = payload.unit.cost;
                }
                items.push(payload);
            }
            return calculateItemAmounts({
                ...state,
                items,
            });
        }

        case "PURCHASE_BILL_ITEM_QUANTITY_UPDATE": {
            const items = [...state.items];
            const [_id, quantity, unit] = action.payload as [PurchaseBillItem["_id"], PurchaseBillItem["quantity"], PurchaseBillItem["unit"]];
            const item = items.find(
                (item) => item._id === _id && item.unit?._id === unit?._id
            );
            if (item) item.quantity = quantity;
            return calculateItemAmounts({
                ...state,
                items,
            });
        }

        case "PURCHASE_BILL_ITEM_DELETE": {
            const items = [...state.items];
            const [_id, unit] = action.payload as [PurchaseBillItem["_id"], PurchaseBillItem["unit"]];
            const itemIndex = items.findIndex(
                (item) => item._id === _id && item.unit?._id === unit?._id
            );
            if (itemIndex >= 0) items.splice(itemIndex, 1);
            return calculateItemAmounts({
                ...state,
                items,
            });
        }

        case "PURCHASE_BILL_SAVE": {
            return {
                ...state,
                billSaved: action.payload,
            };
        }
        case "PURCHASE_BILL_SET_CREDIT": {
            const newState = {
                ...state,
                credit: action.payload,
            };
            if (!action.payload) {
                newState.paidAmount = getBillAmount(newState);
            } else {
                newState.paidAmount = 0;
            }
            return newState;
        }
        case "PURCHASE_BILL_SET_PAID_AMOUNT": {
            if (action.payload <= getBillAmount(state))
                return {
                    ...state,
                    paidAmount: action.payload,
                };
            else return { ...state }
        }
        case "PURCHASE_BILL_SET_LOCATION": {
            return {
                ...state,
                location: action.payload,
            };
        }
        case "PURCHASE_BILL_RESET": {
            return {
                ...initialState,
            };
        }
        default:
            return state;
    }
}
