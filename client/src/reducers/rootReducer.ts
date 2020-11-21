import { combineReducers } from "redux";
import { reducer as formReducer } from "redux-form";
import customerReducer from "./customer.reducer";
import billReducer from "./bill.reducer";
import itemReducer from "./item.reducer";

const reducers = {
	customer: customerReducer,
	bill: billReducer,
	item: itemReducer,
	form: formReducer,
}

const rootReducer = combineReducers(reducers);

export default rootReducer;
