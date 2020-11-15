import { combineReducers } from "redux";
import { reducer as formReducer } from "redux-form";
import customerReducer from "./customer.reducer";
import billReducer from "./bill.reducer";
import itemReducer from "./item.reducer";

const rootReducer = combineReducers({
	customer: customerReducer,
	bill: billReducer,
	item: itemReducer,
	form: formReducer,
});

export default rootReducer;
