import { UserData } from "./auth.reducer";
import { Customer } from "./customer.reducer";
import { Product, Unit } from "./product.reducer";

export interface BillItem extends Product {
	unit?: Unit;
	quantity: number;
	amount: number;
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

export interface BillState {
	customer: Customer | null;
	items: BillItem[];
	discountAmount: number;
	discountPercentage: number;
	billSaved: boolean;
	paidAmount: number;
	credit: boolean;
	location: null | [GeolocationCoordinates["latitude"], GeolocationCoordinates["longitude"]]
}

export interface BillPayments {
	paymentReceivedBy: UserData;
	paidAmount: number;
	createdAt: Date;
}

export interface BillData {
	_id: string;
	serialNumber: number;
	customer: Customer;
	soldBy: UserData;
	belongsTo: UserData;
	items: BillItem[];
	discountAmount: number;
	itemsTotalAmount: number;
	billAmount: number;
	credit: boolean;
	paidAmount: number;
	payments: BillPayments[];
	createdAt: Date;
	location?: {
		type: "Point";
		coordinates: [number, number]
	}
}

const initialState: BillState = {
	customer: null,
	items: [],
	discountAmount: 0,
	discountPercentage: 0,
	billSaved: false,
	paidAmount: 0,
	credit: false,
	location: null,
};

export interface BillPostData extends Object {
	customerId: Customer["_id"],
	discountAmount: BillState["discountAmount"],
	items: { _id: BillItem["_id"]; quantity: BillItem["quantity"]; unit?: Unit["name"] }[];
	credit: BillState["credit"];
	paidAmount: BillState["paidAmount"];
	location?: {
		lat: GeolocationCoordinates["latitude"],
		lon: GeolocationCoordinates["longitude"]
	}
}

export const getItemsTotalAmount = (billState: BillState) => {
	var sum = 0;
	billState.items.forEach((item) => {
		sum += item.amount;
	});
	return sum;
};

export const getBillAmount = (billState: BillState) => {
	return getItemsTotalAmount(billState) - billState.discountAmount;
};

const calculateItemAmounts = (billState: BillState) => {
	billState.items.forEach((item) => {
		if (item.unit) item.amount = item.quantity * item.unit.rate;
		else item.amount = item.quantity * item.rate;
	});
	return billState;
};

const setDiscountAmountFromPercentage = (billState: BillState) => {
	const itemsTotalAmount = getItemsTotalAmount(billState);
	const discountPercentage = billState.discountPercentage;
	const discountAmount = (discountPercentage * itemsTotalAmount) / 100
	if (discountAmount > getItemsTotalAmount(billState)) return { ...billState };
	else return {
		...billState,
		discountAmount
	};
};

const setPercentageFromDiscountAmount = (billState: BillState) => {
	const itemsTotalAmount = getItemsTotalAmount(billState);
	const discountAmount = billState.discountAmount;
	const discountPercentage = (discountAmount / itemsTotalAmount) * 100;
	return {
		...billState,
		discountPercentage: parseFloat(discountPercentage.toFixed(2)),
	};
};

export default function billReducer(state: BillState = initialState, action: { type: string; payload: any }): BillState {
	switch (action.type) {
		case "BILL_SET_CUSTOMER": {
			return {
				...state,
				customer: action.payload,
			};
		}
		case "BILL_SET_DISCOUNT": {
			const payload = Math.abs(action.payload);
			if (payload > getItemsTotalAmount(state)) return state;
			return setPercentageFromDiscountAmount({
				...state,
				discountAmount: payload
			});
		}
		case "BILL_SET_DISCOUNT_PERCENTAGE": {
			const payload = Math.abs(action.payload);
			return setDiscountAmountFromPercentage({
				...state,
				discountPercentage: payload,
			});
		}
		case "BILL_ADD_ITEM": {
			const items = [...state.items];
			let payload = action.payload as BillItem;
			const index = items.findIndex(
				(item) =>
					item._id === payload._id &&
					item.unit?._id === payload.unit?._id
			);
			if (index >= 0) {
				items[index].quantity += payload.quantity;
			} else {
				items.push(payload);
			}
			return calculateItemAmounts({
				...state,
				items,
			});
		}

		case "BILL_ITEM_QUANTITY_UPDATE": {
			const items = [...state.items];
			const [_id, quantity, unit] = action.payload as [BillItem["_id"], BillItem["quantity"], BillItem["unit"]];
			const item = items.find(
				(item) => item._id === _id && item.unit?._id === unit?._id
			);
			if (item) item.quantity = quantity;
			return calculateItemAmounts({
				...state,
				items,
			});
		}

		case "BILL_ITEM_DELETE": {
			const items = [...state.items];
			const [_id, unit] = action.payload as [BillItem["_id"], BillItem["unit"]];
			const itemIndex = items.findIndex(
				(item) => item._id === _id && item.unit?._id === unit?._id
			);
			if (itemIndex >= 0) items.splice(itemIndex, 1);
			return calculateItemAmounts({
				...state,
				items,
			});
		}

		case "BILL_SAVE": {
			return {
				...state,
				billSaved: action.payload,
			};
		}
		case "BILL_SET_CREDIT": {
			return {
				...state,
				credit: action.payload,
			};
		}
		case "BILL_SET_PAID_AMOUNT": {
			return {
				...state,
				paidAmount: action.payload,
			};
		}
		case "BILL_SET_LOCATION": {
			return {
				...state,
				location: action.payload,
			};
		}
		case "BILL_RESET": {
			return {
				...initialState,
			};
		}
		default:
			return state;
	}
}
