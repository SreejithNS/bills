const initialState = {
	itemSuggestions: [],
	itemsList: [],
	itemsListHasNextPage: false,
	itemsListLoad: true,
};

export default function itemReducer(state = initialState, action) {
	switch (action.type) {
		case "ITEM_SUGGESTIONS": {
			return {
				...state,
				itemSuggestions: action.payload,
			};
		}
		case "FETCH_ITEMS_LIST_LOAD": {
			return {
				...state,
				itemsListLoad: action.payload,
			};
		}
		case "FETCH_ITEMS_LIST": {
			const newState = {
				...state,
				itemsList: [...state.itemsList, ...action.payload.docs],
			};
			newState.itemsListHasNextPage =
				newState.itemsList.length < action.payload.totalDocs;
			return newState;
		}
		default:
			return state;
	}
}
