const { Bill } = require("../models/BillModel");
const { body, validationResult, query, param } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const { privilegeEnum } = require("../helpers/privilegeEnum.js");
var mongoose = require("mongoose");
const { Customer } = require("../models/CustomerModel");
const _ = require("lodash");
const { userData, UserData } = require("./AuthController");
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
	// this.serialNumber = Math.abs(parseInt(query.serialNumber))
	// this.serialNumber = this.serialNumber === 0 || !this.serialNumber ? undefined : this.serialNumber;
	// this.customer = query.customerId;
	this.offset = Math.abs(parseInt(query.offset)) || 0;
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
	var flag = false;
	if (authenticatedUser._id === paramBill.belongsTo._id || authenticatedUser._id === paramBill.soldBy._id) { //Belongs to User or soldBy user
		if (authenticatedUser.type === privilegeEnum.admin) { // and user is admin
			flag = true;
		} else if (authenticatedUser.settings && authenticatedUser.settings.permissions.includes(explicitPermission)) {
			flag = true;
		} // user has right to access the bill
	} else if (authenticatedUser._id === paramBill.belongsTo._id) {

	} else if (authenticatedUser.type === privilegeEnum.root) {
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
	async function (req, res) {
		try {
			const authenticatedUser = await userData(req.user._id);
			const bill = await getBillById(req.params._id);
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
 * Get  Bills List created by the user based on query received.
 *
 * @returns [Object] {Object}
 */
exports.getAllBills = [
	auth,
	query("serialNumber")
		.optional()
		.isInt({ min: 1 }),
	query(["page", "limit", "offset"])
		.optional()
		.isInt(),
	query(["customer", "soldBy"])
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
				...(req.query.serialNumber && {
					"serialNumber": req.query.serialNumber
				}),
				...(req.query.customer && {
					"customer": req.query.customer
				}),
				...(req.query.soldBy && {
					"soldBy": req.query.soldBy
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

				const paymentInfo = {
					paidAmount: req.body.paidAmount,
					paymentReceivedBy: req.user._id,
				}

				bill.payments.push(paymentInfo);

				bill.paidAmount += parseFloat(req.body.paidAmount);
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

/**
 * Get all Bills List created by salesmen under the admin.
 *
 * @returns [Object] {Object}
 */
// exports.getBillsFromSalesmen = [
// 	auth,
// 	function (req, res) {
// 		try {
// 			//TODO: Aggregate to lookup to the salesmen of the admin.
// 			Bill.find({ soldBy: req.user._id }, (err, bills) => {
// 				if (err) return apiResponse.ErrorResponse(res, err);

// 				if (bills.length > 0) {
// 					return apiResponse.successResponseWithData(
// 						res,
// 						"Operation success",
// 						bills
// 					);
// 				} else {
// 					return apiResponse.successResponseWithData(
// 						res,
// 						"Operation success",
// 						[]
// 					);
// 				}
// 			});
// 		} catch (err) {
// 			//throw error in json response with status 500.
// 			return apiResponse.ErrorResponse(res, err);
// 		}
// 	},
// ];
// //For data analys
// exports.itemsAndQuantities = [
// 	auth,
// 	function (req, res) {
// 		Bill.aggregate([
// 			{
// 				$unwind: {
// 					path: "$items",
// 				},
// 			},
// 			{
// 				$project: {
// 					_id: "$_id",
// 					itemName: "$items.name",
// 					itemRate: "$items.rate",
// 					itemMrp: "$items.mrp",
// 					itemCode: "$items.code",
// 					quantity: "$items.quantity",
// 					createdAt: "$createdAt",
// 				},
// 			},
// 			{
// 				$group: {
// 					_id: "$itemCode",
// 					itemCode: {
// 						$first: "$itemCode",
// 					},
// 					itemName: {
// 						$first: "$itemName",
// 					},
// 					itemRate: {
// 						$first: "$itemRate",
// 					},
// 					itemMrp: {
// 						$first: "$itemMrp",
// 					},
// 					quantity: {
// 						$sum: "$quantity",
// 					},
// 					billedAt: {
// 						$first: "$createdAt",
// 					},
// 				},
// 			},
// 			{
// 				$project: {
// 					name: "$itemName",
// 					code: "$itemCode",
// 					quantity: "$quantity",
// 					totalAmount: {
// 						$multiply: ["$quantity", "$itemRate"],
// 					},
// 					profit: {
// 						$subtract: [
// 							{
// 								$multiply: ["$quantity", "$itemMrp"],
// 							},
// 							{
// 								$multiply: ["$quantity", "$itemRate"],
// 							},
// 						],
// 					},
// 				},
// 			},
// 			{
// 				$sort: {
// 					profit: -1,
// 				},
// 			},
// 		]).exec((err, data) => {
// 			if (err) return apiResponse.ErrorResponse(res, err);
// 			return apiResponse.successResponseWithData(res, "Values of", data);
// 		});
// 	},
// ];

// exports.customerAndPurchases = [
// 	auth,
// 	function (req, res) {
// 		Bill.aggregate([
// 			{
// 				$group: {
// 					_id: "$customer",
// 					totalAmount: {
// 						$sum: "$billAmount",
// 					},
// 				},
// 			},
// 			{
// 				$lookup: {
// 					from: "customers",
// 					localField: "_id",
// 					foreignField: "_id",
// 					as: "customerDetails",
// 				},
// 			},
// 			{
// 				$unwind: {
// 					path: "$customerDetails",
// 					preserveNullAndEmptyArrays: false,
// 				},
// 			},
// 			{
// 				$set: {
// 					customerName: "$customerDetails.name",
// 				},
// 			},
// 			{
// 				$sort: {
// 					totalAmount: -1,
// 				},
// 			},
// 		]).exec((err, data) => {
// 			if (err) return apiResponse.ErrorResponse(res, err);
// 			return apiResponse.successResponseWithData(res, "Values of", data);
// 		});
// 	},
// ];
