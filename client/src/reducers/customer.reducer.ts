import { UserData } from "./auth.reducer";

export interface GeoLocation {
	type: "Point";
	coordinates: number[];
}

export interface Customer {
	_id: string;
	name: string;
	place: string;
	phone: string;
	location?: GeoLocation;
	belongsTo: UserData;
}

const initialState = {
	customersList: [],
	listLoading: false,
	listLoadingError: "",
	customerAddError: false,
	customerAddLoad: false,
	customerSuggestions: [],
};

export default function customerReducer(state = initialState, action: { type: string; payload: any; }) {
	switch (action.type) {
		case "FETCH_CUSTOMERS_LIST": {
			return {
				...state,
				customersList: action.payload,
			};
		}
		case "FETCH_CUSTOMERS_LIST_LOAD": {
			return {
				...state,
				listLoading: action.payload,
			};
		}
		case "FETCH_CUSTOMERS_LIST_ERROR": {
			return {
				...state,
				listLoadingError: action.payload,
			};
		}
		case "ADD_CUSTOMER_LOAD": {
			return {
				...state,
				customerAddLoad: action.payload,
			};
		}
		case "ADD_CUSTOMER_ERROR": {
			return {
				...state,
				customerAddError: action.payload,
			};
		}
		case "CUSTOMER_SUGGESTIONS": {
			return {
				...state,
				customerSuggestions: action.payload,
			};
		}
		case "CUSTOMER_SUGGESTIONS_RESET": {
			return {
				...state,
				customerSuggestions: [],
			};
		}
		default:
			return state;
	}
}
