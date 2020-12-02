const initialState = {
	settings: {},
	userData: {},
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
		default:
			return state;
	}
}
