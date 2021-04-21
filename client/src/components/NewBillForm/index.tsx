import React, { useEffect, useState } from "react";
import TextField from "@material-ui/core/TextField";
import {
	Button,
	Checkbox,
	CircularProgress,
	createStyles,
	FormControl,
	FormControlLabel,
	Grid,
	InputLabel,
	makeStyles,
	MenuItem,
	Select,
	Theme,
	Typography,
	Zoom,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import MaterialTable from "material-table";
import { useDispatch, useSelector } from "react-redux";
import { createFilterOptions } from "@material-ui/lab/Autocomplete";
import NewCustomerCreationModal from "../NewCustomerCreationModal";
import { toast } from "react-toastify";
import { BillPostData, getBillAmount } from "../../reducers/bill.reducer";
import { tableIcons } from "../MaterialTableIcons";
import { Customer } from "../../reducers/customer.reducer";
import { axios, APIResponse, handleAxiosError } from "../Axios";
import { UserData, UserPermissions } from "../../reducers/auth.reducer";
import { BillItem } from "../../reducers/bill.reducer";
import { RootState } from "../../reducers/rootReducer";
import { Product, Unit } from "../../reducers/product.reducer";
import { useHasPermission } from "../../actions/auth.actions";
import { ProductCategorySelection } from "../../pages/ItemsHomePage";
import useAxios from "axios-hooks";
import useGeolocation from 'react-hook-geolocation'

const useStyles = makeStyles((theme: Theme) => createStyles({
	"buttons": {
		"&>*": {
			marginRight: theme.spacing(1)
		}
	}
}))

function CustomerSelection(props: {
	customer: Customer | undefined;
	onChange: (value: Customer | null | string) => void;
	addNewCustomer: (customerName: Customer["name"]) => void;
}) {
	const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
	const [customerInputValue, setCustomerInputValue] = useState<Customer["name"]>("");
	const hasPermissionToAccess = useHasPermission(UserPermissions.ALLOW_CUSTOMER_POST);

	useEffect(() => {
		if (customerInputValue) {
			setCustomerSuggestions([]);
			axios
				.get<APIResponse<Customer[]>>("/customer/suggestions/" + customerInputValue)
				.then((response) => {
					let data = response.data.data;
					if (data?.length) {
						setCustomerSuggestions(data);
					}
				}, handleAxiosError);
		}
	}, [customerInputValue]);

	return (
		<Autocomplete
			value={props.customer}
			options={customerSuggestions}
			autoHighlight
			getOptionLabel={(option: Customer) => option.name}
			onInputChange={(event: any, val: Customer["name"]) => setCustomerInputValue(val)}
			onChange={(event, newValue) => props.onChange(newValue)}
			selectOnFocus
			freeSolo
			handleHomeEndKeys
			filterOptions={(options, params) => {
				const filtered = createFilterOptions<Customer>({ ignoreCase: true })(
					options,
					params
				);

				if (
					hasPermissionToAccess &&
					params.inputValue !== ""
				) {
					filtered.push({
						name: params.inputValue,
						_id: "",
						belongsTo: {} as UserData,
						phone: 0,
						place: "",
					});
				}

				return filtered;
			}}
			fullWidth={true}
			renderOption={(option) => (
				<React.Fragment>
					{option.phone === 0 && option._id === "" ? (
						<Button onClick={() => props.addNewCustomer(option._id)}>
							Add&nbsp;<em><strong>{option.name}</strong></em>&nbsp;as new customer
						</Button>
					) : (
						option.name
					)}
				</React.Fragment>
			)}
			renderInput={(params) => <TextField {...params} label="Customer" variant="outlined" />}
		/>
	);
}

function BillItemSelection(props: {
	product: Product | undefined;
	onChange: (newValue: Product | null) => void;
}) {
	const [productsSuggestion, setProductsSuggestion] = useState<Product[]>([]);
	const [productCode, setProductCode] = useState<Product["code"]>("");
	const productCategory = useSelector((state: RootState) => state.product.productCategory);

	useEffect(() => {
		if (productCode) {
			setProductsSuggestion([]);
			axios
				.get<APIResponse<Product[]>>(`/product/${productCategory?._id}/suggestion/${productCode}`)
				.then((response) => {
					let data = response.data.data;
					if (data?.length) {
						setProductsSuggestion(data);
					}
				}, handleAxiosError);
		}
	}, [productCode, productCategory]);

	return (
		<Autocomplete
			value={props.product}
			options={productsSuggestion}
			filterOptions={createFilterOptions({
				ignoreCase: true,
				stringify: (option: Product) => option.code,
			})}
			getOptionLabel={(option: Product) => option.name}
			onInputChange={(event: any, val: Product["code"]) => setProductCode(val)}
			onChange={(event, newValue) => props.onChange(newValue)}
			fullWidth={true}
			renderInput={(params) => <TextField {...params} label="Item Code" variant="outlined" />}
		/>
	);
}

export default function NewBillForm(props: { closeModal: () => void }) {
	const classes = useStyles();
	const dispatch = useDispatch();
	const billState = useSelector((state: RootState) => state.bill);
	const {
		customer,
		items,
		credit,
		discountAmount,
		discountPercentage,
		paidAmount,
		billSaved,
		location
	} = billState;
	const handleGeoLocation = (data: any) => {
		if (!location) dispatch({
			type: "BILL_SET_LOCATION", payload: [
				data.latitude, data.longitude
			]
		})
		if (location && (data.latitude !== location[0] || data.longitude !== location[1])) {
			dispatch({
				type: "BILL_SET_LOCATION", payload: [
					data.latitude, data.longitude
				]
			})
		}
	}
	const geoLocation = useGeolocation({
		enableHighAccuracy: true,
		maximumAge: 5000,
		timeout: 10000
	}, handleGeoLocation);

	const [selectedProduct, setSelectedProduct] = useState<Product>();
	const [selectedProductUnit, setSelectedProductUnit] = useState<Unit>();
	const [itemQuantity, setItemQuantity] = useState(1);

	const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);

	const billData = (): BillPostData | null => {

		const itemsData: BillPostData["items"] = items.map((item) => ({
			_id: item._id,
			quantity: item.quantity,
			unit: item.unit?.name ?? undefined,
		}));
		if (customer && items.length)
			return {
				customerId: customer._id,
				items: itemsData,
				credit,
				discountAmount,
				paidAmount,
				...(location && { location: { lat: location[0], lon: location[1] } })
			};
		else return null;
	};

	const [{ error, loading, data }, saveBill] = useAxios<
		APIResponse<{ _id: string; serialNumber: number }>
	>(
		{
			url: "/bill",
			method: "POST",
			data: billData(),
		},
		{ manual: true }
	);

	useEffect(() => {
		if (error) {
			handleAxiosError<any[]>(error);
		}
		if (data) {
			dispatch({ type: "BILL_SAVE", payload: true });
			if (billSaved) toast.success(`Bill#${data.data?.serialNumber} added`);
			dispatch({ type: "BILL_RESET" })
			props.closeModal();
		}
	}, [error, data, dispatch, props, billSaved]);

	const setValues = (
		parameter: "credit" | "discountAmount" | "discountPercentage" | "paidAmount"
	) => (newValue: string | boolean | number) => {
		switch (parameter) {
			case "credit":
				dispatch({
					type: "BILL_SET_CREDIT",
					payload: !credit,
				});
				break;
			case "discountAmount":
				dispatch({
					type: "BILL_SET_DISCOUNT",
					payload: parseFloat(newValue.toString()),
				});
				break;
			case "discountPercentage":
				dispatch({
					type: "BILL_SET_DISCOUNT_PERCENTAGE",
					payload: parseFloat(newValue.toString()),
				});
				break;
			case "paidAmount":
				dispatch({
					type: "BILL_SET_PAID_AMOUNT",
					payload: parseFloat(newValue.toString()),
				});
				break;
		}
	};

	const addItemPossible = (): boolean => {
		if (itemQuantity <= 0) return false;
		if (!selectedProduct) return false;
		return true;
	};

	const addItemToBill = () => {
		if (selectedProduct && addItemPossible()) {
			const product: BillItem = { ...selectedProduct, quantity: itemQuantity, amount: 0 };
			if (selectedProductUnit) {
				product.amount = itemQuantity * selectedProductUnit.rate;
			} else {
				product.amount = itemQuantity * selectedProduct.rate;
			}

			if (selectedProductUnit) {
				product.unit = selectedProductUnit;
			}

			dispatch({ type: "BILL_ADD_ITEM", payload: product });
		} else {
			toast.warn("Couldn't add item to the bill");
		}
	};

	return (
		<form>
			<Grid container direction="row" justify="space-between" alignItems="center" spacing={3}>
				<Grid item xs>
					<CustomerSelection
						addNewCustomer={(newCustomerName) => setNewCustomerModalOpen(true)}
						customer={customer ?? undefined}
						onChange={(customer) =>
							dispatch({ type: "BILL_SET_CUSTOMER", payload: customer })
						}
					/>
				</Grid>
				<Grid item>
					<ProductCategorySelection />
				</Grid>
				<Grid item xs={12}>
					<BillItemSelection
						onChange={(newValue) => setSelectedProduct(newValue ?? undefined)}
						product={selectedProduct}
					/>
				</Grid>
				<Grid item xs={6} sm>
					<TextField
						label="Quantity"
						type="number"
						fullWidth
						onFocus={(event) => {
							const target = event.target;
							target.select();
							setItemQuantity(1);
						}}
						onChange={(event) => setItemQuantity(parseFloat(event.target.value))}
						variant="outlined"
					/>
				</Grid>
				{selectedProduct?.units.length && (
					<Grid item xs={6} sm={2}>
						<FormControl variant="outlined" fullWidth>
							<InputLabel>Unit</InputLabel>
							<Select
								value={selectedProductUnit?.name ?? ""}
								onChange={(event) => {
									const value = event.target.value;
									setSelectedProductUnit(
										selectedProduct?.units.find(
											(unit) => unit.name === value
										) ?? undefined
									);
								}}
								label="Unit"
							>
								<MenuItem value={""}>GENERAL</MenuItem>
								{selectedProduct.units.map((unit, key) => (
									<MenuItem key={key} value={unit.name}>
										{unit.name.toUpperCase()}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
				)}
				<Grid item xs={4} sm>
					<Button
						variant="contained"
						color="primary"
						disabled={!addItemPossible()}
						fullWidth
						onClick={addItemToBill}
						disableElevation
					>
						Add
					</Button>
				</Grid>
				<Grid item xs={12}>
					<MaterialTable
						icons={tableIcons}
						isLoading={loading}
						columns={[
							{
								title: "Item Name",
								field: "name",
								editable: "never",
								// render: (rowData) => (
								// 	<>
								// 		<strong>{rowData.name}</strong>{" "}
								// 		{rowData.unit
								// 			? "( " + rowData.unit.name.toUpperCase() + " )"
								// 			: ""
								// 		}
								// 	</>
								// ),
							},
							{
								title: "Quantity",
								field: "quantity",
								type: "numeric",
								editable: "onUpdate",

							},
							{
								title: "Amount",
								field: "amount",
								type: "numeric",
								editable: "never",
							},
							{ title: "Rate", field: "rate", type: "numeric", editable: "never" },
						]}
						data={items ?? []}
						options={{
							search: false,
							paging: false,
							toolbar: false,
							actionsColumnIndex: -1,
							padding: "dense",
						}}
						editable={{
							onRowUpdate: (newData) =>
								new Promise<void>((res, rej) => {
									dispatch({
										type: "BILL_ITEM_QUANTITY_UPDATE",
										payload: [newData._id, newData.quantity, newData.unit],
									});
									res();
								}),
							onRowDelete: (newData) =>
								new Promise<void>((res, rej) => {
									dispatch({
										type: "BILL_ITEM_DELETE",
										payload: [newData._id, newData.unit],
									});
									res();
								}),
						}}
					/>
				</Grid>
				<Grid item xs={6}>
					<TextField
						label="Discount Percentage"
						type="number"
						fullWidth
						variant="outlined"
						onFocus={(event) => {
							event.target.select();
						}}
						onChange={(event) => setValues("discountPercentage")(event.target.value)}
						value={discountPercentage || ""}
					/>
				</Grid>
				<Grid item xs={6}>
					<TextField
						label="Discount Amount"
						type="number"
						fullWidth
						variant="outlined"
						onFocus={(event) => {
							event.target.select();
						}}
						onChange={(event) => setValues("discountAmount")(event.target.value)}
						value={discountAmount || ""}
					/>
				</Grid>
				<Grid item xs={4}>
					<TextField
						value={getBillAmount(billState)}
						label="Total Amount"
						InputProps={{
							readOnly: true,
						}}
						type="number"
						variant="outlined"
					/>
				</Grid>
				<Grid item xs={4}>
					<FormControlLabel
						control={
							<Checkbox
								checked={credit}
								onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
									setValues("credit")(event.target.checked)
								}
								name="credit"
								color="primary"
							/>
						}
						label="Credit Amount"
					/>
				</Grid>
				<Grid item xs={4}>
					<TextField
						value={paidAmount}
						label="Paid Amount"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							setValues("paidAmount")(event.target.value)
						}
						type="number"
						variant="outlined"
					/>
				</Grid>
				<Grid item xs={12} className={classes.buttons}>
					<Button
						variant="contained"
						disabled={billSaved || !billData() || loading}
						onClick={() => saveBill()}
						color="primary"
					>
						Save Bill
					</Button>
					<Button
						variant="outlined"
						disabled={loading}
						onClick={() => dispatch({ type: "BILL_RESET" })}
						color="secondary"
					>
						RESET
					</Button>
					{geoLocation?.error && <Typography variant="caption" color="textSecondary" display="inline">
						( No Location information )
					</Typography>
					}
					{/* {location && <Button
						variant="text"
						disabled={geoLocation?.error}
						onClick={() => update()}
						color="primary"
					>
						Update Customer Location
					</Button>} */}
					<Zoom in={loading}>
						<CircularProgress />
					</Zoom>
				</Grid>
			</Grid>
			<NewCustomerCreationModal
				visible={newCustomerModalOpen}
				onClose={() => setNewCustomerModalOpen(false)}
				onCreate={() => setNewCustomerModalOpen(false)}
			/>
		</form>
	);
}