const initialState = {
    customers: [],
    listLoading: false,
    error: ""
}

export default function customerReducer(state = initialState, action) {
    switch (action.type) {
        case 'FETCH_CUSTOMERS_LIST': {
            return {
                ...state,
                customers: action.payload,
                listLoading: false
            }
        }
        case 'FETCH_CUSTOMERS_LIST_LOAD': {
            return {
                ...state,
                listLoading: true
            }
        }
        case 'FETCH_CUSTOMERS_LIST_ERROR': {
            return {
                ...state,
                listLoading: false,
                error: action.payload
            }
        }
        default:
            return state
    }
}