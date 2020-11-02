const initialState = {
	customersList: [],
	listLoading: false,
	listLoadingError: "",
};

export default function customerReducer(state = initialState, action) {
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
		default:
			return state;
	}
}
