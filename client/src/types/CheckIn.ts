import { BillItem, BillData } from './../reducers/bill.reducer';
import { UserData } from './../reducers/auth.reducer';
import { Customer, GeoLocation } from "../reducers/customer.reducer";

export interface CheckInDTO extends Pick<BillData, "discountAmount" | "itemsTotalAmount" | "billAmount"> {
    _id: string;
    createdAt: string;
    updatedAt: string;
    checkedBy: string | UserData;
    belongsTo: string | UserData<true>;
    contact: Customer | null;
    products: BillItem[];
    checkInLocation: GeoLocation;
    distance: number | null;
    note: string | null;
    dates: {
        name: string;
        label: string;
        value: string;
    }[];
}