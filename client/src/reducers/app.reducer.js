const initialState = {
	settings: {},
	userData: {},
	salesmenListError: false,
	salesmenList: [],
	salesmenListLoading: false,
	appInitilised: false,
	userDataLoading: true,
	appInitiliseError: {
		error: false,
		message: "",
	},
};

export default function appReducer(state = initialState, action) {
	switch (action.type) {
		case "USER_DATA": {
			const newState = { ...state };
			newState.userData = action.payload;
			newState.settings = action.payload.settings;
			return { ...newState };
		}
		case "USER_DATA_LOAD": {
			return {
				...state,
				userDataLoading: action.payload,
			};
		}
		case "USER_DATA_ERROR": {
			return {
				...state,
				appInitiliseError: action.payload,
			};
		}
		case "SALESMEN_LIST": {
			const newState = { ...state };
			newState.salesmenList = action.payload;
			return { ...newState };
		}
		case "SALESMEN_LIST_LOAD": {
			return {
				...state,
				salesmenListLoading: action.payload,
			};
		}
		case "SALESMEN_LIST_ERROR": {
			return {
				...state,
				salesmenListError: action.payload,
			};
		}
		default:
			return state;
	}
}
