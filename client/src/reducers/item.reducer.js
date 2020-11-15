const initialState = {
	itemSuggestions: [],
};

export default function itemReducer(state = initialState, action) {
	switch (action.type) {
		case "ITEM_SUGGESTIONS": {
			return {
				...state,
				itemSuggestions: action.payload,
			};
		}
		default:
			return state;
	}
}
