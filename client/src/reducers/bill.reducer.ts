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
}

const initialState: BillState = {
	customer: null,
	items: [],
	discountAmount: 0,
	discountPercentage: 0,
	billSaved: false,
	paidAmount: 0,
	credit: true,
};

export interface BillPostData extends Object {
	customerId: Customer["_id"],
	discountAmount: BillState["discountAmount"],
	items: { _id: BillItem["_id"]; quantity: BillItem["quantity"]; unit?: Unit["name"] }[];
	credit: BillState["credit"];
	paidAmount: BillState["paidAmount"];
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
		item.amount = item.quantity * item.rate;
	});
	return billState;
};

const setDiscountAmountFromPercentage = (billState: BillState) => {
	const itemsTotalAmount = getItemsTotalAmount(billState);
	const discountPercentage = billState.discountPercentage;

	return {
		...billState,
		discountAmount: (discountPercentage * itemsTotalAmount) / 100,
	};
};

const setPercentageFromDiscountAmount = (billState: BillState) => {
	const itemsTotalAmount = getItemsTotalAmount(billState);
	const discountAmount = billState.discountPercentage;

	return {
		...billState,
		discountPercentage: (discountAmount / itemsTotalAmount) * 100,
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
			return setPercentageFromDiscountAmount({
				...state,
				discountAmount:
					Math.abs(action.payload) > 0 ? action.payload : 0,
			});
		}
		case "BILL_SET_DISCOUNT_PERCENTAGE": {
			return setDiscountAmountFromPercentage({
				...state,
				discountPercentage:
					Math.abs(action.payload) > 0 ? action.payload : 0,
			});
		}
		case "BILL_ADD_ITEM": {
			const items = [...state.items];
			const index = items.findIndex(
				(item) =>
					item._id === action.payload._id &&
					item.unit?.name === action.payload.unit?.name
			);
			if (index >= 0) {
				items[index].quantity += action.payload.quantity;
			} else {
				items.push(action.payload);
			}
			return calculateItemAmounts({
				...state,
				items,
			});
		}

		case "BILL_ITEM_QUANTITY_UPDATE": {
			const items = [...state.items];
			const [_id, quantity, unit] = action.payload;
			const item = items.find(
				(item) => item._id === _id && (unit ? item.unit?.name === unit?.name : true)
			);
			if (item) item.quantity = quantity;
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
		default:
			return state;
	}
}
