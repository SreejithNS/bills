export enum UserTypes {
    root = 0,
    admin = 1,
    salesman = 2
}

export interface UserSettings extends Object {
    permissions: UserPermissions[]
}

export enum UserPermissions {
    "ALLOW_USER_POST",
    "ALLOW_USER_PUT",
    "ALLOW_USER_DELETE",
    "ALLOW_USER_GET",
    "ALLOW_CUSTOMER_POST",
    "ALLOW_CUSTOMER_GET",
    "ALLOW_CUSTOMER_DELETE",
    "ALLOW_CUSTOMER_PUT",
    "ALLOW_PRODUCT_POST",
    "ALLOW_PRODUCT_PUT",
    "ALLOW_PRODUCT_DELETE",
    "ALLOW_PRODUCT_GET",
    "ALLOW_BILL_POST",
    "ALLOW_BILL_PUT",
    "ALLOW_BILL_DELETE",
    "ALLOW_BILL_GET",
    "ALLOW_PAGE_ITEMS",
    "ALLOW_PAGE_BILLS",
    "ALLOW_PAGE_CUSTOMERS",
    "ALLOW_PAGE_ACCOUNTS",
    "ALLOW_PAGE_HOME",
}

// export enum UserPermissions {
//     ALLOW_USER_POST="USER_POST",
//     ALLOW_USER_PUT="USER_PUT",
//     ALLOW_USER_DELETE="USER_DELETE",
//     ALLOW_USER_GET="USER_GET",
//     ALLOW_CUSTOMER_POST="CUSTOMER_POST",
//     ALLOW_CUSTOMER_GET="CUSTOMER_GET",
//     ALLOW_CUSTOMER_DELETE="CUSTOMER_DELETE",
//     ALLOW_CUSTOMER_PUT="CUSTOMER_PUT",
//     ALLOW_PRODUCT_POST="PRODUCT_POST",
//     ALLOW_PRODUCT_PUT="PRODUCT_PUT",
//     ALLOW_PRODUCT_DELETE="PRODUCT_DELETE",
//     ALLOW_PRODUCT_GET="PRODUCT_GET",
//     ALLOW_BILL_POST="BILL_POST",
//     ALLOW_BILL_PUT="BILL_PUT",
//     ALLOW_BILL_DELETE="BILL_DELETE",
//     ALLOW_BILL_GET="BILL_GET",
// }

export interface UserData extends Object {
    _id: string;
    name: string;
    phone: number;
    belongsTo?: UserData;
    type: UserTypes;
    settings: UserSettings;
}

export type ErrorStatus = 0 | 1;

export interface ErrorState extends Object {
    status: ErrorStatus;
    message: string;
}

export interface AuthState {
    userData: UserData | null,
    loading: boolean,
    error: ErrorState,
    usersUnderUser: UserData[]
}

const initialState: AuthState = {
    userData: null,
    loading: false,
    error: {
        status: 0,
        message: ""
    },
    usersUnderUser: []
};

export default function authReducer(state: AuthState = initialState, action: { type: any; payload: any; }): AuthState {
    switch (action.type) {
        case "USER_DATA": {
            const payload = action.payload as UserData;
            if (payload.settings?.permissions?.length) {
                payload.settings.permissions = payload.settings.permissions.map((permission: UserPermissions) => UserPermissions[permission]) as unknown as UserPermissions[]
            }
            return {
                ...state,
                userData: payload
            };
        }
        case "USER_DATA_LOAD": {
            return {
                ...state,
                loading: action.payload,
            };
        }
        case "USER_DATA_ERROR": {
            return {
                ...state,
                error: action.payload,
            };
        }
        case "USERS_UNDER_USERS": {
            return {
                ...state,
                usersUnderUser: action.payload,
            };
        }
        default:
            return state;
    }
}