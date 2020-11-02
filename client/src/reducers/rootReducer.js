import { combineReducers } from "redux";
import customerReducer from "./customer.reducer";

const rootReducer = combineReducers({
	customer: customerReducer,
});

export default rootReducer;
