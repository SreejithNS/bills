import { axios } from "../components/Axios";

export async function fetchBills(
	params?: Partial<Record<"createdAt" | "soldBy", any>>,
	disableCache: boolean = false
) {
	const urlSearchParams = { filter: JSON.stringify(params) };
	return axios.get("/analytics/bills", {
		params: urlSearchParams,
		cache: {
			ignoreCache: disableCache,
		},
	});
}

export async function fetchCustomers(disableCache: boolean = false) {
	return axios.get("/analytics/customers", {
		cache: {
			ignoreCache: disableCache,
		},
	});
}
