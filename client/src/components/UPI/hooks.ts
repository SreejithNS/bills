import { useSelector } from "react-redux";
import UPI from ".";
import { RootState } from "../../reducers/rootReducer";
import { billsPaths, paths } from "../../routes/paths.enum";

export function useUPI({ amount, billId }: {
    amount?: number;
    billId?: string;
}) {
    const config = useSelector((state: RootState) => state.auth.organistaionData);

    if (!config) {
        return {
            uri: "",
            available: false,
        };
    } else {
        const { upiname, upivpa } = config;
        if (!upiname || !upivpa) {
            return {
                uri: "",
                available: false,
            };
        }

        let upi = new UPI(upiname, upivpa, amount);

        if (billId) {
            const billURL = new URL(window.location.origin + paths.billsHome + billsPaths.billDetail.replace(":id", billId));
            upi.url = billURL;
        }

        return {
            uri: upi.toString(),
            available: true,
        }
    }
}