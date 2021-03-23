const initialState = {
	itemCategory: "general",
	itemSuggestions: [],
	itemsList: [],
	itemsListHasNextPage: false,
	itemsListLoad: true,
};

export default function itemReducer(state = initialState, action: { type: string; payload: any; }) {
	switch (action.type) {
		case "SET_ITEM_CATEGORY": {
			return {
				...state,
				itemCategory: action.payload,
			};
		}
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