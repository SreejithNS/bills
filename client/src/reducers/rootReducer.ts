import { AnyAction, combineReducers } from "redux";
import { reducer as formReducer } from "redux-form";
import customerReducer from "./customer.reducer";
import billReducer from "./bill.reducer";
import itemReducer from "./item.reducer";
import authReducer from "./auth.reducer";
import productReducer from "./product.reducer";
import purchaseBillReducer from "./purchasebill.reducer";
import { store } from "../index";
import { useDispatch } from "react-redux";
import { ThunkDispatch } from "redux-thunk";

const reducers = {
	auth: authReducer,
	customer: customerReducer,
	bill: billReducer,
	purchaseBill: purchaseBillReducer,
	item: itemReducer,
	form: formReducer,
	product: productReducer
}

const rootReducer = combineReducers(reducers);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = ThunkDispatch<RootState, void, AnyAction>;
export const useAppDispatch = () => useDispatch<AppDispatch>()

export default rootReducer;
