export enum UserTypes {
    root = 0,
    admin = 1,
    salesman = 2
}

export interface UserSettings extends Object {
    permissions: UserPermissions[]
}

export interface OrganisationDetails extends Object {
    name: string;
    printTitle: string;
    tagline: string;
    printHeader: string;
    printFooter: string;
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
    "ALLOW_PRODUCTCATEGORY_POST",
    "ALLOW_PRODUCTCATEGORY_PUT",
    "ALLOW_PRODUCTCATEGORY_DELETE",
    "ALLOW_PRODUCTCATEGORY_GET",
    "ALLOW_BILL_POST",
    "ALLOW_BILL_PUT",
    "ALLOW_BILL_DELETE",
    "ALLOW_BILL_GET",
    "ALLOW_BILL_GET_ALL",
    "ALLOW_PAGE_ITEMS",
    "ALLOW_PAGE_BILLS",
    "ALLOW_PAGE_CUSTOMERS",
    "ALLOW_PAGE_ACCOUNTS",
    "ALLOW_PAGE_HOME",
}

export interface UserData<T = boolean> extends Object {
    _id: string;
    name: string;
    phone: number;
    belongsTo?: UserData;
    type: UserTypes;
    settings: UserSettings;
    organisation: T extends true ? OrganisationDetails : null;
}

export type ErrorStatus = 0 | 1;

export interface ErrorState extends Object {
    status: ErrorStatus;
    message: string;
}

export interface AuthState {
    userData: UserData | null,
    organistaionData: OrganisationDetails | null,
    loading: boolean,
    error: ErrorState,
    usersUnderUser: UserData[] | null;
}

const initialState: AuthState = {
    userData: null,
    organistaionData: null,
    loading: false,
    error: {
        status: 0,
        message: ""
    },
    usersUnderUser: null
};

export default function authReducer(state: AuthState = initialState, action: { type: any; payload: any; }): AuthState {
    switch (action.type) {
        case "USER_DATA": {
            let payload = action.payload as UserData;
            let organisation: OrganisationDetails | null;

            if (payload.type !== 2) {
                payload = payload as UserData<true>
                organisation = payload.organisation;
            } else {
                organisation = payload.belongsTo?.organisation ?? null;
            }

            if (payload.settings?.permissions?.length) {
                payload.settings.permissions = payload.settings.permissions.map((permission: UserPermissions) => UserPermissions[permission]) as unknown as UserPermissions[]
            }
            return {
                ...state,
                userData: payload,
                organistaionData: organisation,
                ...(payload.type === UserTypes.salesman && { usersUnderUser: [] })
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
        case "USERS_UNDER_USER": {
            const payload = action.payload as UserData[];
            for (let user of payload) {
                if (user.settings?.permissions?.length) {
                    user.settings.permissions = user.settings.permissions.map((permission: UserPermissions) => UserPermissions[permission]) as unknown as UserPermissions[]
                }
            }
            return {
                ...state,
                usersUnderUser: payload,
            };
        }
        default:
            return state;
    }
}