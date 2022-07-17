import React, { useCallback, useEffect, useRef, useState } from "react";
import TextField from "@material-ui/core/TextField";
import {
	Button,
	Checkbox,
	CircularProgress,
	createStyles,
	FormControl,
	FormControlLabel,
	Grid,
	InputAdornment,
	InputLabel,
	makeStyles,
	MenuItem,
	Paper,
	Select,
	Theme,
	Typography,
	withStyles,
	Zoom,
} from "@material-ui/core";
import { Autocomplete as AutocompleteBase } from "@material-ui/lab";
import MaterialTable from "material-table";
import { useDispatch, useSelector } from "react-redux";
import { createFilterOptions } from "@material-ui/lab/Autocomplete";
import NewCustomerCreationModal from "../NewCustomerCreationModal";
import { toast } from "react-toastify";
import { PurchaseBillPostData, getBillAmount, getItemsTotalAmount, PurchaseBillItem } from "../../reducers/purchasebill.reducer";
import { tableIcons } from "../MaterialTableIcons";
import { Customer } from "../../reducers/customer.reducer";
import { axios, APIResponse, handleAxiosError } from "../Axios";
import { UserData, UserPermissions } from "../../reducers/auth.reducer";
import { RootState } from "../../reducers/rootReducer";
import { Product, Unit } from "../../reducers/product.reducer";
import { useHasPermission } from "../../actions/auth.actions";
import useAxios from "axios-hooks";
import { BillItem } from "../../reducers/bill.reducer";

const useStyles = makeStyles((theme: Theme) => createStyles({
	"buttons": {
		"&>*": {
			marginRight: theme.spacing(1)
		}
	},
	tablePaper: {
		padding: theme.spacing(1),
		borderColor: theme.palette.primary.main,
		borderWidth: 2
	},
	discountAdornment: {
		marginRight: theme.spacing(1)
	},
	labelOutline: {
		border: `2px solid ${theme.palette.primary.main}`
	},
	resize: {
		fontSize: theme.typography.h5.fontSize
	}
}))

const Autocomplete = withStyles((theme: Theme) => ({
	listbox: {
		color: theme.palette.secondary.main,
		border: `2px solid ${theme.palette.secondary.light}`,
		borderRadius: "inherit"
	}
}))(AutocompleteBase) as typeof AutocompleteBase;

function CustomerSelection(props: {
	contact: Customer | undefined;
	onChange: (value: Customer | null) => void;
	addNewCustomer: (contactName: Customer["name"]) => void;
}) {
	const [contactSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
	const [contactInputValue, setCustomerInputValue] = useState<Customer["name"]>("");
	const [suggestionsLoading, setSuggestionsLoading] = useState(false);
	const hasPermissionToAccess = useHasPermission(UserPermissions.ALLOW_CUSTOMER_POST);

	useEffect(() => {
		if (contactInputValue) {
			setSuggestionsLoading(true);
			axios
				.get<APIResponse<Customer[]>>("/customer/suggestions/" + contactInputValue)
				.then((response) => {
					let data = response.data.data;
					if (data?.length) {
						setCustomerSuggestions(data);
					}
				}, handleAxiosError).finally(() => setSuggestionsLoading(false));
		}
	}, [contactInputValue]);

	return (
		<Autocomplete
			value={props.contact ?? null}
			options={contactSuggestions}
			getOptionSelected={(option, value) => {
				return props.contact?._id === value._id
			}}
			autoHighlight
			loading={suggestionsLoading}
			getOptionLabel={(option: Customer) => option.name}
			onInputChange={(event: any, val: Customer["name"]) => setCustomerInputValue(val)}
			onChange={(event, newValue) => props.onChange(newValue)}
			selectOnFocus
			handleHomeEndKeys
			filterOptions={(options, params) => {
				const filtered = createFilterOptions<Customer>({ ignoreCase: true })(
					options,
					params
				);

				if (
					hasPermissionToAccess &&
					params.inputValue !== "" &&
					!suggestionsLoading
				) {
					filtered.push({
						name: params.inputValue,
						_id: "",
						belongsTo: {} as UserData,
						phone: "",
						place: "",
					});
				}

				return filtered;
			}}
			fullWidth={true}
			renderOption={(option) => (
				<React.Fragment>
					{option.phone === "" && option._id === "" ? (
						<Button onClick={() => props.addNewCustomer(option._id)}>
							Add&nbsp;&quot;<strong>{option.name}</strong>&quot;&nbsp;as new contact
						</Button>
					) : (
						option.name
					)}
				</React.Fragment>
			)}
			renderInput={(params) => <TextField {...params} label="Supplier" variant="outlined" />}
		/>
	);
}

function PurchaseBillItemSelection(props: {
	product: Product | undefined;
	onChange: (newValue: Product | null) => void;
}) {
	const [productsSuggestion, setProductsSuggestion] = useState<Product[]>([]);
	const [productCode, setProductCode] = useState<Product["code"]>("");
	const [suggestionsLoading, setSuggestionsLoading] = useState(false);
	const productCategory = useSelector((state: RootState) => state.product.productCategory);

	const { onChange: propsOnChange } = props;
	const onChange = useCallback(
		(value: Product | null) => {
			return propsOnChange(value)
		},
		[propsOnChange]
	)
	useEffect(() => {
		if (productCode) {
			setSuggestionsLoading(true);
			axios
				.get<APIResponse<Product[]>>(`/product/${productCategory?._id}/suggestion/${productCode}`)
				.then((response) => {
					let data = response.data.data;
					if (data?.length) {
						setProductsSuggestion(data);
					}
				}, handleAxiosError).finally(() => setSuggestionsLoading(false));
		}
	}, [productCode, productCategory]);
	return (
		<Autocomplete
			value={props.product ?? null}
			options={productsSuggestion}
			getOptionSelected={(_, value) => {
				return props.product?._id === value._id
			}}
			loading={suggestionsLoading}
			filterOptions={createFilterOptions({
				ignoreCase: true,
				stringify: (option: Product) => option.code,
			})}
			getOptionLabel={(option: Product) => option.name}
			onInputChange={(_, val: Product["code"]) => setProductCode(val)}
			onChange={(_, newValue) => onChange(newValue)}
			fullWidth={true}
			renderInput={(params) => <TextField {...params} size="small" label="Item Code" variant="outlined" />}
		/>
	);
}

export default function NewPurchaseBillForm(props: { closeModal: (id?: string) => void }) {
	const classes = useStyles();
	const dispatch = useDispatch();
	const billState = useSelector((state: RootState) => state.purchaseBill);
	const productCategory = useSelector((state: RootState) => state.product.productCategory?._id);
	const quantityRef = useRef<HTMLInputElement>(null);
	const {
		contact,
		items,
		credit,
		discountAmount,
		discountPercentage,
		paidAmount,
		billSaved,
		location
	} = billState;

	const [geolocationError, setGeolocationError] = useState(false);

	useEffect(() => {
		const handleGeoLocation = (data: GeolocationPosition) => {
			if (!location) dispatch({
				type: "PURCHASE_BILL_SET_LOCATION", payload: [
					data.coords.longitude, data.coords.latitude,
				]
			})
			if (location && (data.coords.latitude !== location[0] || data.coords.longitude !== location[1])) {
				dispatch({
					type: "PURCHASE_BILL_SET_LOCATION", payload: [
						data.coords.longitude, data.coords.latitude,
					]
				})
			}
			setGeolocationError(false);
		}

		if (navigator.geolocation) {
			navigator.geolocation.watchPosition(handleGeoLocation, (e) => {
				if (e) setGeolocationError(true)
			}, {
				enableHighAccuracy: true,
				timeout: 1000,
				maximumAge: 5000
			});
		}
		//eslint-disable-next-line
	}, [])

	const [selectedProduct, setSelectedProduct] = useState<Product>();
	const [selectedProductUnit, setSelectedProductUnit] = useState<Unit>();
	const [itemQuantity, setItemQuantity] = useState(0);

	const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);

	const billData = (): PurchaseBillPostData | null => {

		const itemsData: PurchaseBillPostData["items"] = items.map((item) => ({
			_id: item._id,
			quantity: item.quantity,
			unit: item.unit?.name ?? undefined,
		}));
		if (contact && items.length)
			return {
				contact: contact._id,
				category: productCategory ?? "",
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
			url: "/purchasebill",
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
			dispatch({ type: "PURCHASE_BILL_SAVE", payload: true });
			if (billSaved) toast.success(`Bill#${data.data?.serialNumber} added`);
			dispatch({ type: "PURCHASE_BILL_RESET" })
			props.closeModal(data.data?._id);
		}
	}, [error, data, dispatch, props, billSaved]);

	const setValues = (
		parameter: "credit" | "discountAmount" | "discountPercentage" | "paidAmount"
	) => (newValue: string | boolean | number) => {
		switch (parameter) {
			case "credit":
				dispatch({
					type: "PURCHASE_BILL_SET_CREDIT",
					payload: !credit,
				});
				break;
			case "discountAmount":
				dispatch({
					type: "PURCHASE_BILL_SET_DISCOUNT",
					payload: Math.abs(parseFloat(newValue.toString()) || 0),
				});
				break;
			case "discountPercentage":
				dispatch({
					type: "PURCHASE_BILL_SET_DISCOUNT_PERCENTAGE",
					payload: Math.abs(parseFloat(newValue.toString()) || 0),
				});
				break;
			case "paidAmount":
				dispatch({
					type: "PURCHASE_BILL_SET_PAID_AMOUNT",
					payload: Math.abs(parseFloat(newValue.toString()) || 0),
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

			dispatch({ type: "PURCHASE_BILL_ADD_ITEM", payload: product });
			setItemQuantity(0);
			setSelectedProduct(undefined);
			setSelectedProductUnit(undefined);
		} else {
			toast.warn("Couldn't add item to the bill");
		}
	};

	const clearBill = () => {
		setSelectedProduct(void 0);
		setSelectedProductUnit(void 0);
		setItemQuantity(0);
		dispatch({ type: "PURCHASE_BILL_RESET" })
	}
	return (
		<form>
			<Grid container direction="row" justify="space-between" alignItems="center" spacing={2}>
				<Grid item xs={12}>
					<CustomerSelection
						addNewCustomer={(_newCustomerName) => setNewCustomerModalOpen(true)}
						contact={contact ?? undefined}
						onChange={(contact) =>
							dispatch({ type: "PURCHASE_BILL_SET_CUSTOMER", payload: contact })
						}
					/>
				</Grid>
				<Grid item xs={12}>
					<PurchaseBillItemSelection
						onChange={(newValue: any) => { setSelectedProduct(newValue ?? undefined); quantityRef.current?.focus(); }}
						product={selectedProduct}
					/>
				</Grid>
				<Grid item xs>
					<form onSubmit={(e) => { e.preventDefault(); if (addItemPossible()) addItemToBill() }}>
						<TextField
							inputRef={quantityRef}
							label="Quantity"
							type="number"
							fullWidth
							value={itemQuantity || ""}
							onFocus={(event) => event.target.select()}
							onChange={(event) => setItemQuantity(parseFloat(event.target.value) || 0)}
							variant="outlined"
							size="small"
						/>
					</form>
				</Grid>
				{!!(selectedProduct?.units.length) && (
					<Grid item xs>
						<FormControl variant="outlined" size="small" fullWidth>
							<InputLabel>Unit</InputLabel>
							<Select
								value={selectedProductUnit?.name ?? selectedProduct.primaryUnit}
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
								<MenuItem value={selectedProduct.primaryUnit}>{selectedProduct.primaryUnit}</MenuItem>
								{selectedProduct.units.map((unit, key) => (
									<MenuItem key={key} value={unit.name}>
										{unit.name.toUpperCase()}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
				)}
				<Grid item>
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
						components={{
							Container: props => <Paper className={classes.tablePaper} {...props} variant="outlined" />
						}}
						columns={[
							{
								title: "Item",
								field: "name",
								editable: "never",
							},
							{
								title: "Quantity",
								field: "quantity",
								type: "numeric",
								editable: "onUpdate",
								render: (data) => data.unit ? data.quantity + " " + data.unit.name : data.quantity
							},
							{
								title: "Amount",
								field: "amount",
								type: "numeric",
								editable: "never",
							},
							{ title: "Cost", field: "cost", type: "numeric", editable: "never" },
						]}
						data={items ?? [] as PurchaseBillItem[]}
						options={{
							search: false,
							paging: false,
							toolbar: false,
							actionsColumnIndex: -1,
							padding: "dense"
						}}
						editable={{
							onRowUpdate: (newData) =>
								new Promise<void>((res, rej) => {
									dispatch({
										type: "PURCHASE_BILL_ITEM_QUANTITY_UPDATE",
										payload: [newData._id, newData.quantity, newData.unit],
									});
									res();
								}),
							onRowDelete: (newData) =>
								new Promise<void>((res, rej) => {
									dispatch({
										type: "PURCHASE_BILL_ITEM_DELETE",
										payload: [newData._id, newData.unit],
									});
									res();
								}),
						}}
					/>
				</Grid>
				<Grid item xs={12}>
					<TextField
						value={getItemsTotalAmount(billState)}
						label="Total"
						InputProps={{
							readOnly: true,
							startAdornment: <InputAdornment position="start"></InputAdornment>,
						}}
						type="number"
						variant="outlined"
						size="small"
						fullWidth
					/>
				</Grid>
				<Grid item xs={6}>
					<TextField
						label="Discount %"
						type="number"
						fullWidth
						variant="outlined"
						InputProps={{
							endAdornment: <InputAdornment position="start">%</InputAdornment>
						}}
						onFocus={(event) => {
							event.target.select();
						}}
						onChange={(event) => setValues("discountPercentage")(event.target.value)}
						value={discountPercentage || ""}
						size="small"
					/>
				</Grid>
				<Grid item xs={6}>
					<TextField
						label="Discount "
						type="number"
						fullWidth
						variant="outlined"
						InputProps={{
							startAdornment: <InputAdornment position="start"></InputAdornment>
						}}
						onFocus={(event) => {
							event.target.select();
						}}
						onChange={(event) => setValues("discountAmount")(event.target.value)}
						value={discountAmount || ""}
						size="small"
					/>
				</Grid>
				<Grid item xs={12}>
					<TextField
						value={getBillAmount(billState)}
						label="Bill Amount"
						InputProps={{
							readOnly: true, startAdornment: <InputAdornment position="start"></InputAdornment>,
							classes: {
								notchedOutline: classes.labelOutline,
								input: classes.resize
							}
						}}
						type="number"
						color="secondary"
						variant="outlined"
						fullWidth
					/>
				</Grid>
				<Grid item xs>
					<TextField
						value={paidAmount || ""}
						InputProps={{
							startAdornment: <InputAdornment position="start"></InputAdornment>,
						}}
						label="Paid"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							setValues("paidAmount")(event.target.value)
						}
						type="number"
						variant="outlined"
						size="small"
						fullWidth
					/>
				</Grid>
				<Grid item xs>
					<TextField
						value={getBillAmount(billState) - paidAmount}
						InputProps={{
							readOnly: true,
							startAdornment: <InputAdornment position="start"></InputAdornment>,
						}}
						label="Balance"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							setValues("paidAmount")(event.target.value)
						}
						type="number"
						variant="outlined"
						size="small"
						fullWidth
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
						onClick={() => clearBill()}
						color="secondary"
					>
						RESET
					</Button>
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
					/><br />
					{geolocationError && <Typography variant="caption" color="error" display="inline">
						( No Location ) - Try turning ON GPS.
					</Typography>
					}
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
		</form >
	);
}