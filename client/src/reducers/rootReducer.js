import { combineReducers } from "redux";
import { reducer as formReducer } from "redux-form";
import customerReducer from "./customer.reducer";

const rootReducer = combineReducers({
	customer: customerReducer,
	form: formReducer,
});

export default rootReducer;
