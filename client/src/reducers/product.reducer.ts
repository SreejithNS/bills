import { UserData } from './auth.reducer';
export interface Product {
    _id: string;
    code: string;
    name: string;
    primaryUnit: string;
    quantity?: number;
    rate: number;
    mrp: number;
    cost: number;
    stocked: boolean;
    stock: number;
    units: Unit[];
    category: ProductCategory;
}

export interface Unit {
    _id: string;
    name: string;
    rate: number;
    mrp: number;
    cost: number;
    conversion: number;
}

export interface ProductCategory {
    _id: string;
    name: string;
    hasAccess: UserData[];
    belongsTo: UserData;
}

export interface ProductState {
    productCategory: ProductCategory | null;
    productCategoryList: ProductCategory[];
}

const initialState: ProductState = {
    productCategory: null,
    productCategoryList: []
};

export default function productReducer(state: ProductState = initialState, action: { type: string; payload: any }): ProductState {
    switch (action.type) {
        case "SET_ITEM_CATEGORY": {
            localStorage.setItem("productCategoryId", action.payload?._id);
            return {
                ...state,
                productCategory: { ...action.payload },
            };
        }
        case "SET_ITEM_CATEGORY_LIST": {
            return {
                ...state,
                productCategoryList: action.payload,
            };
        }
        default:
            return state;
    }
}