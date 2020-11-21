const initialState = {
	customer: {
		name: "",
	},
	items: [],
	itemsLoad: false,
	discountAmount: 0,
	discountPercentage: 0,
	billSaveLoad: false,
	billsList: [],
	billsListLoad: true,
	billData: {},
};
export const getItemsTotalAmount = (billState) => {
	var sum = 0;
	billState.items.forEach((item) => {
		sum += item.amount;
	});
	return sum;
};

export const getBillAmount = (billState) => {
	return getItemsTotalAmount(billState) - billState.discountAmount;
};

const calculateItemAmounts = (billState) => {
	billState.items.forEach((item) => {
		item.amount = item.quantity * item.rate;
	});
	return billState;
};

const setDiscountAmountFromPercentage = (billState) => {
	const itemsTotalAmount = getItemsTotalAmount(billState);
	const discountPercentage = billState.discountPercentage;

	return {
		...billState,
		discountAmount: (discountPercentage * itemsTotalAmount) / 100,
	};
};

const setPercentageFromDiscountAmount = (billState) => {
	const itemsTotalAmount = getItemsTotalAmount(billState);
	const discountAmount = billState.discountPercentage;

	return {
		...billState,
		discountPercentage: (discountAmount / itemsTotalAmount) * 100,
	};
};

export default function billReducer(state = initialState, action) {
	switch (action.type) {
		case "BILL_ADD_CUSTOMER": {
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
		case "BILL_CUSTOMER_LOAD": {
			return action.payload
				? {
						...state,
						customer: { name: "Loading..." },
				  }
				: { ...state };
		}

		case "BILL_ADD_ITEM": {
			const items = [...state.items];
			const index = items.findIndex(
				(item) => item.id === action.payload.id
			);
			if (index >= 0) {
				items[index].quantity += Math.abs(action.payload.quantity);
			} else {
				items.push(action.payload);
			}
			return calculateItemAmounts({
				...state,
				items,
			});
		}
		case "BILL_ADD_ITEM_LOAD": {
			return {
				...state,
				itemsLoad: action.payload,
			};
		}
		case "BILL_ITEM_QUANTITY_UPDATE": {
			const items = [...state.items];
			const [id, quantity] = action.payload;
			const item = items.find((item) => item.id === id);
			item.quantity = quantity;
			return calculateItemAmounts({
				...state,
				items,
			});
		}
		case "BILL_SAVE_LOAD": {
			return {
				...state,
				billSaveLoad: action.payload,
			};
		}
		case "FETCH_BILLS_LIST_LOAD": {
			return {
				...state,
				billsListLoad: action.payload,
			};
		}
		case "FETCH_BILLS_LIST": {
			return {
				...state,
				billsList: action.payload,
			};
		}
		default:
			return state;
	}
}
