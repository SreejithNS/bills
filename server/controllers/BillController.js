const { Bill } = require("../models/BillModel");
const { body, validationResult, query, param } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const { privilegeEnum } = require("../helpers/privilegeEnum.js");
var mongoose = require("mongoose");
const { Customer } = require("../models/CustomerModel");
const _ = require("lodash");
const { userData, UserData } = require("./AuthController");
const Papa = require("papaparse");
mongoose.set("useFindAndModify", false);


//Types
/**
 * Bill Data from bill document
 * @param {Bill} doc - Bill Document
 */
function BillData(doc) {
	this._id = doc._id;
	this.serialNumber = doc.serialNumber;
	this.customer = doc.customer;
	this.soldBy = new UserData(doc.soldBy);
	this.belongsTo = new UserData(doc.belongsTo);
	this.items = doc.items;
	this.location = doc.location;
	this.discountAmount = doc.discountAmount;
	this.itemsTotalAmount = doc.itemsTotalAmount;
	this.billAmount = doc.billAmount;
	this.credit = doc.credit;
	this.paidAmount = doc.paidAmount;
	this.payments = doc.payments.map((payment) => {
		payment.paymentReceivedBy = new UserData(payment.paymentReceivedBy);
		return payment;
	});
	this.createdAt = doc.createdAt;
}

function QueryParser(query) {
	this.page = Math.abs(parseInt(query.page)) || 1;
	this.limit = Math.abs(parseInt(query.limit)) || 5;
	// this.soldBy = query.soldBy;
	this.sort = query.sort;
	this.lean = true;
	this.populate = ["belongsTo", "soldBy", "customer"]
}

// Function
/**
 * Get a single bill by its id
 * @param {Bill._id} _id 
 * @returns {Bill}
 */
async function getBillById(_id) {
	const bill = await Bill
		.findById(_id)
		.populate("customer")
		.populate("soldBy")
		.populate("belongsTo")
		.populate("payments.paymentReceivedBy")
		.exec();
	return bill;
}
/**
 * Check whether the authenticated user has access to the bill
 * @param {User} authenticatedUser 
 * @param {Bill} paramBill 
 * @param {string|string[]} explicitPermission 
 * @returns {boolean} 
 */
function hasAccessPermission(authenticatedUser, paramBill, explicitPermission) {
	paramBill = new BillData(paramBill);
	var flag = false;
	if (authenticatedUser._id === paramBill.belongsTo._id || authenticatedUser._id === paramBill.soldBy._id) { //Belongs to User or soldBy user
		if (authenticatedUser.type === privilegeEnum.admin) { // and user is admin
			flag = true;
		} else if (authenticatedUser.settings && authenticatedUser.settings.permissions.includes(explicitPermission)) {
			flag = true;
		} // user has right to access the bill
	} else if (authenticatedUser.belongsTo._id === paramBill.belongsTo._id) { // Bill and user belong to same admin
		if (authenticatedUser.settings && authenticatedUser.settings.permissions.includes(explicitPermission)) {
			flag = true;
		}
	}
	if (authenticatedUser.type === privilegeEnum.root) {
		flag = true;
	}
	if (!flag) throw new Error("User is not authorised to access this data");
	return flag;
}

// Middlewares

/**
 * Get the bill data from id
 *
 */
exports.getBill = [
	auth,
	param("billId").trim().isMongoId(),
	async function (req, res) {
		const validationError = validationResult(req);
		if (!validationError.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Query Validation Error",
				validationError.array()
			);
		try {
			const authenticatedUser = await userData(req.user._id);
			const bill = await getBillById(req.params.billId);
			if (bill) {
				if (hasAccessPermission(authenticatedUser, bill, "ALLOW_BILL_GET")) {
					return apiResponse.successResponseWithData(
						res,
						"Bill Data",
						new BillData(bill)
					)
				}
			}
		} catch (e) {
			return apiResponse.ErrorResponse(res, e.message || e);
		}
	}
];

/**
 * Delete the bill data by id
 *
 */
exports.deleteBill = [
	auth,
	param("billId").trim().isMongoId(),
	async function (req, res) {
		const validationError = validationResult(req);
		if (!validationError.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Query Validation Error",
				validationError.array()
			);
		try {
			const authenticatedUser = await userData(req.user._id);
			const bill = await getBillById(req.params.billId);
			if (bill) {
				if (hasAccessPermission(authenticatedUser, bill, "ALLOW_BILL_DELETE")) {
					await bill.remove();
					return apiResponse.successResponse(
						res,
						"Bill Deleted"
					)
				}
			}
		} catch (e) {
			return apiResponse.ErrorResponse(res, e.message || e);
		}
	}
];

/**
 * Get  Bills List created by the user based on query received.
 *
 * @returns [Object] {Object}
 */
exports.getAllBills = [
	auth,
	query("serialNumber")
		.optional()
		.isInt({ min: 1 }),
	query(["page", "limit", "offset", "startDate", "endDate"])
		.optional()
		.isInt(),
	query(["customer", "soldBy"])
		.optional()
		.isMongoId(),
	query("credit")
		.optional()
		.isBoolean(),
	async function (req, res) {
		try {
			const validationError = validationResult(req);
			if (!validationError.isEmpty())
				return apiResponse.validationErrorWithData(
					res,
					"Query Validation Error",
					validationError.array()
				);

			const authenticatedUser = await userData(req.user._id);

			const query = {};
			if (authenticatedUser.type === privilegeEnum.root) {
				Object.assign(query, {});
			} else if (authenticatedUser.type === privilegeEnum.admin) {
				if (authenticatedUser.belongsTo) {
					Object.assign(query, { belongsTo: authenticatedUser.belongsTo._id })
				} else {
					Object.assign(query, { belongsTo: authenticatedUser._id })
				}
			} else if (authenticatedUser.settings && authenticatedUser.settings.permissions.includes("ALLOW_BILL_GET")) {
				Object.assign(query, { belongsTo: authenticatedUser.belongsTo._id })
			}

			const queryWithSearch = {
				...(req.query.serial && {
					"serialNumber": parseInt(req.query.serial)
				}),
				...(req.query.customer && {
					"customer": req.query.customer
				}),
				...(req.query.soldBy && {
					"soldBy": req.query.soldBy
				}),
				...((req.query.credit !== undefined && req.query.credit !== null) && {
					"credit": req.query.credit
				}),
				...((req.query.startDate || req.query.endDate) && {
					"createdAt": {
						...(req.query.startDate && { $gte: new Date(parseInt(req.query.startDate)) }),
						...(req.query.endDate && { $lte: new Date(parseInt(req.query.endDate)) })
					}
				}),
				...query
			}

			const paginateOptions = new QueryParser(req.query);

			return Bill.paginate(queryWithSearch, paginateOptions).then(
				(bills) => {
					bills.docs = bills.docs.map((doc) => new BillData(doc));
					return apiResponse.successResponseWithData(
						res,
						"Operation success",
						bills
					);
				},
				(err) => apiResponse.ErrorResponse(res, err)
			);
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];


/**
 * Get  Bills List created by the user based on query received as CSV.
 *
 * @returns [Object] {Object}
 */
exports.getAllBillsAsCSV = [
	auth,
	query(["limit", "offset", "startDate", "endDate"])
		.optional()
		.isInt(),
	query(["customer", "soldBy"])
		.optional()
		.isMongoId(),
	query("credit")
		.optional()
		.isBoolean(),
	async function (req, res) {
		try {
			const validationError = validationResult(req);
			if (!validationError.isEmpty())
				return apiResponse.validationErrorWithData(
					res,
					"Query Validation Error",
					validationError.array()
				);

			const authenticatedUser = await userData(req.user._id);

			const query = {};
			if (authenticatedUser.type === privilegeEnum.root) {
				Object.assign(query, {});
			} else if (authenticatedUser.type === privilegeEnum.admin) {
				if (authenticatedUser.belongsTo) {
					Object.assign(query, { belongsTo: authenticatedUser.belongsTo._id })
				} else {
					Object.assign(query, { belongsTo: authenticatedUser._id })
				}
			} else if (authenticatedUser.settings && authenticatedUser.settings.permissions.includes("ALLOW_BILL_GET")) {
				Object.assign(query, { belongsTo: authenticatedUser.belongsTo._id })
			}

			const queryWithSearch = {
				...(req.query.customer && {
					"customer": req.query.customer
				}),
				...(req.query.soldBy && {
					"soldBy": req.query.soldBy
				}),
				...((req.query.credit !== undefined && req.query.credit !== null) && {
					"credit": req.query.credit
				}),
				...((req.query.startDate || req.query.endDate) && {
					"createdAt": {
						...(req.query.startDate && { $gte: new Date(parseInt(req.query.startDate)) }),
						...(req.query.endDate && { $lte: new Date(parseInt(req.query.endDate)) })
					}
				}),
				...query
			}

			const paginateOptions = { ...(new QueryParser(req.query)) };

			return Bill.find(queryWithSearch).sort(paginateOptions.sort).populate("soldBy", "name").populate("customer").exec().then(
				(bills) => {
					bills = bills.map((doc) => {
						return {
							"Bill Number": doc.serialNumber,
							"Customer": doc.customer.name,
							"Location": doc.customer.place || "",
							"Date": doc.createdAt,
							"Sold By": doc.soldBy.name,
							"Total Amount": doc.itemsTotalAmount,
							"Discount Amount": doc.discountAmount,
							"Bill Amount": doc.billAmount,
							"Paid Amount": doc.paidAmount,
							"Status": doc.credit ? "IN CREDIT" : "CLOSED",
							"Balance": doc.billAmount - doc.paidAmount
						};
					});

					const csv = Papa.unparse(bills);
					res.set("Access-Control-Expose-Headers", "x-bills-report-filename");
					return apiResponse.successResponseWithFile(
						res.set("x-bills-report-filename", "bills_report_" + (new Date()).toDateString() + ".csv"),
						"bills_report_" + (new Date()).toDateString() + ".csv",
						csv
					);
				},
				(err) => apiResponse.ErrorResponse(res, err)
			);
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}

	},
];

/**
 * Get products wise sales report as CSV.
 *
 * @returns [Object] {Object}
 */
exports.getProductWiseSalesAsCSV = [
	auth,
	query("month").isInt({ max: 12, min: 1 }),
	query("year").isInt({ min: 2021 }),
	query("soldBy")
		.optional()
		.isMongoId(),
	async function (req, res) {
		try {
			const validationError = validationResult(req);
			if (!validationError.isEmpty())
				return apiResponse.validationErrorWithData(
					res,
					"Query Validation Error",
					validationError.array()
				);

			const authenticatedUser = await userData(req.user._id);

			const query = {
				"month": req.query.month,
				"year": req.query.year
			};
			if (authenticatedUser.type === privilegeEnum.root) {
				Object.assign(query, {});
			} else if (authenticatedUser.type === privilegeEnum.admin) {
				if (authenticatedUser.belongsTo) {
					Object.assign(query, { belongsTo: authenticatedUser.belongsTo._id })
				} else {
					Object.assign(query, { belongsTo: authenticatedUser._id })
				}
			} else if (authenticatedUser.settings && authenticatedUser.settings.permissions.includes("ALLOW_BILL_GET")) {
				Object.assign(query, { belongsTo: authenticatedUser.belongsTo._id })
			}

			const queryWithSearch = {
				...(req.query.soldBy && {
					"soldBy": req.query.soldBy
				}),
				...query
			};

			const paginateOptions = { ...(new QueryParser(req.query)) };
			const pipeline = [
				{
					"$match": {
						"belongsTo": mongoose.Types.ObjectId(queryWithSearch.belongsTo)
					}
				}, {
					"$unwind": {
						"path": "$items",
						"preserveNullAndEmptyArrays": false
					}
				}, {
					"$group": {
						"_id": {
							"belongsTo": "$belongsTo",
							"name": "$items.name",
							"code": "$items.code",
							"unit": "$items.unit",
							"rate": "$items.rate",
							"month": {
								"$month": "$createdAt"
							},
							"year": {
								"$year": "$createdAt"
							}
						},
						"soldBy": {
							"$addToSet": "$soldBy"
						},
						"quantity": {
							"$sum": "$items.quantity"
						},
						"averageQuantity": {
							"$avg": "$items.quantity"
						},
						"billCount": {
							"$sum": 1
						}
					}
				}, {
					"$project": {
						"_id": "$_id.code",
						"belongsTo": "$_id.belongsTo",
						"soldBy": 1,
						"month": "$_id.month",
						"year": "$_id.year",
						"name": "$_id.name",
						"unit": "$_id.unit",
						"rate": "$_id.rate",
						"quantity": 1,
						"billCount": 1,
						"averageQuantity": 1,
						"amount": {
							"$multiply": [
								"$_id.rate", "$quantity"
							]
						}
					}
				},
				{
					"$match": {
						"month": parseInt(queryWithSearch.month),
						"year": parseInt(queryWithSearch.year),
						...(queryWithSearch.soldBy && {
							"soldBy": mongoose.Types.ObjectId(queryWithSearch.soldBy)
						})
					}
				}
			];
			return Bill.aggregate(pipeline).exec().then(
				(bills) => {
					bills = bills.map((doc) => {
						return {
							"Product Code": doc._id,
							"Product Name": doc.name,
							"Product Rate": doc.rate,
							"Product Unit": doc.unit,
							"Total Sold Quantity": doc.quantity,
							"Bill Count": doc.billCount,
							"Total Sales in Amount": doc.amount
						};
					});

					const csv = Papa.unparse(bills);
					res.set("Access-Control-Expose-Headers", "x-bills-report-filename");
					return apiResponse.successResponseWithFile(
						res.set("x-bills-report-filename", "product_sales_" + req.query.month + "_" + req.query.year + ".csv"),
						"product_sales_" + req.query.month + "_" + req.query.year + ".csv",
						csv
					);
				},
				(err) => apiResponse.ErrorResponse(res, err)
			);
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}

	},
];


/**
 * Save a bill
 *
 * @param {string}      customerId
 * @param {string[]}    items
 * @param {string}      discountAmount
 *
 * @returns {Object}
 */
exports.saveBill = [
	auth,
	body("customerId", "Not a valid Customer Id")
		.trim()
		.escape()
		.isMongoId()
		.withMessage("Error in customer id"),
	body("items", "Items list must be an array").isArray(),
	body("discountAmount", "Discount should be set")
		.trim()
		.escape()
		.isNumeric(),
	body("paidAmount").optional().trim().escape().isNumeric(),
	body("credit").optional().trim().escape().isBoolean(),
	body("location", "Invalid coordinates")
		.optional()
		.custom((value) => {
			const { lat, lon } = value;
			const reg = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
			return reg.test(lat + "," + lon);
		}),
	async function (req, res) {
		const validationError = validationResult(req);
		if (!validationError.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error for bill",
				validationError.array()
			);

		await Customer.countDocuments({ _id: req.body.customerId })
			.exec()
			.then(
				(count) => {
					if (count === 0) {
						return apiResponse.notFoundResponse(
							res,
							"CustomerID not found"
						);
					} else {
						return Bill.populateItemsWithQuantity(req.body.items);
					}
				},
				(err) =>
					apiResponse.ErrorResponse(
						res,
						"CustomerID error:" + err.message
					)
			)
			.then(
				async (populatedItems) => {
					try {
						req.body.items = populatedItems;
						const authenticatedUser = await userData(req.user._id);
						const belongsTo =
							(authenticatedUser.type === privilegeEnum.admin || authenticatedUser.type === privilegeEnum.root)
								? authenticatedUser._id
								: authenticatedUser.belongsTo._id;

						var newBill = new Bill({
							customer: req.body.customerId,
							items: req.body.items,
							discountAmount: req.body.discountAmount,
							soldBy: req.user._id,
							credit:
								req.body.credit === undefined ||
									req.body.credit === null
									? true
									: req.body.credit,
							paidAmount:
								req.body.paidAmount === undefined ||
									req.body.paidAmount === null
									? 0
									: req.body.paidAmount,
							belongsTo,
							...(req.body.location && { location: { type: "Point", coordinates: [req.body.location.lat, req.body.location.lon] } })
						});

						newBill.itemsTotalAmount = newBill.calculateItemsTotalAmount();
						newBill.billAmount = newBill.calculateBillAmount();

						if (newBill.paidAmount > 0)
							newBill.payments.push({
								paidAmount: newBill.paidAmount,
								paymentReceivedBy: req.user._id,
							});

						return newBill.save();
					} catch (e) {
						return apiResponse.ErrorResponse(res, e.message);
					}
				},
				(err) => apiResponse.ErrorResponse(res, err.message)
			)
			.then(
				(bill) =>
					apiResponse.successResponseWithData(res, "Bill created", {
						_id: bill._id,
						serialNumber: bill.serialNumber
					}),
				(err) =>
					apiResponse.ErrorResponse(
						res,
						"Error in saving the bill:" + err.message
					)
			);
	},
];

exports.receivePayment = [
	auth,
	body("paidAmount", "Invalid Payment Amount").escape().trim().isFloat({ min: 1 }),
	param("billId", "Invalid Bill ID").escape().trim().isMongoId(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error.",
				errors.array()
			);
		}
		try {
			const authenticatedUser = await userData(req.user._id);
			const bill = await getBillById(req.params.billId);
			if (!bill) {
				return apiResponse.notFoundResponse(res, "Bill Not Found");
			} else {
				if (!hasAccessPermission(authenticatedUser, bill, "ALLOW_BILL_PUT"))
					return apiResponse.unauthorizedResponse(
						res,
						"You are not allowed to receive payment for this bill."
					);

				const balance = bill.billAmount - bill.paidAmount;
				if (balance < parseFloat(req.body.paidAmount)) {
					return apiResponse.validationErrorWithData(res, "Validation Error.", [{ msg: "Paid amount is more than Balance" }])
				}

				const paymentInfo = {
					paidAmount: req.body.paidAmount,
					paymentReceivedBy: req.user._id,
				}

				bill.payments.push(paymentInfo);

				bill.paidAmount += parseFloat(req.body.paidAmount);

				if (bill.paidAmount === bill.billAmount) bill.credit = false;

				return bill.save().then(() =>
					apiResponse.successResponse(res, "Bill payment received")
				);
			}
		} catch (e) {
			return apiResponse.ErrorResponse(
				res,
				e.message || e
			);
		}
	},
];

exports.deletePayment = [
	auth,
	param("billId", "Invalid Bill ID").escape().trim().isMongoId(),
	param("paymentId", "Invalid Payment ID").escape().trim().isMongoId(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error.",
				errors.array()
			);
		}
		try {
			const authenticatedUser = await userData(req.user._id);
			const bill = await getBillById(req.params.billId);
			if (!bill) {
				return apiResponse.notFoundResponse(res, "Bill Not Found");
			} else {
				if (!hasAccessPermission(authenticatedUser, bill, "ALLOW_BILL_PUT"))
					return apiResponse.unauthorizedResponse(
						res,
						"You are not allowed to receive payment for this bill."
					);
				const paymentIndex = bill.payments.findIndex((payment) => payment._id.toString() === req.params.paymentId);
				if (paymentIndex >= 0) {
					bill.paidAmount -= bill.payments[paymentIndex].paidAmount;
					bill.payments.splice(paymentIndex, 1);
					bill.credit = true;
				} else {
					return apiResponse.notFoundResponse(res, "Payment not found");
				}

				return bill.save().then(() =>
					apiResponse.successResponse(res, "Bill marked as credit by deleting payment")
				);
			}
		} catch (e) {
			return apiResponse.ErrorResponse(
				res,
				e.message || e
			);
		}
	},
];

exports.toggleBillCredit = [
	auth,
	param("billId").escape().trim().isMongoId(),
	async function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error.",
				errors.array()
			);
		}
		try {
			const authenticatedUser = await userData(req.user._id);
			const bill = await getBillById(req.params.billId);

			if (!bill) {
				return apiResponse.notFoundResponse(res, "Bill not found");
			}
			if (hasAccessPermission(authenticatedUser, bill, "ALLOW_BILL_PUT")) {
				bill.credit = !bill.credit;
				return bill.save().then(() =>
					apiResponse.successResponse(res, "Bill credit toggled")
				);
			} else {
				return apiResponse.unauthorizedResponse(res, "Not authorised to access this bill")
			}
		} catch (e) {
			return apiResponse.ErrorResponse(
				res,
				e.message || e
			)
		}
	}
];

