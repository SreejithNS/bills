const Bill = require("../models/BillModel");
const { body, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const privilageEnum = require("../helpers/privilegeEnum.js");
var mongoose = require("mongoose");
const CustomerModel = require("../models/CustomerModel");
const _ = require("lodash");
mongoose.set("useFindAndModify", false);

/**
 * Get the bill data from id
 *
 * @returns [object] {Object}
 */
exports.getBill = [
	auth,
	function (req, res) {
		Bill.findById(req.params.id)
			.populate("customer")
			.populate("soldBy")
			.exec()
			.then(
				(doc) => {
					if (
						doc.comesUnder === req.user.id ||
						doc.comesUnder === req.user.worksUnder
					) {
						return apiResponse.successResponseWithData(
							res,
							"Bill found",
							doc
						);
					} else {
						return apiResponse.unauthorizedResponse(
							res,
							"You are not authorised to access this bill"
						);
					}
				},
				() => apiResponse.ErrorResponse(res, "Bill fetch error")
			);
	},
];

/**
 * Get  Bills List created by the user based on query received.
 *
 * @returns [Object] {Object}
 */
exports.getAllBills = [
	auth,
	function (req, res) {
		try {
			const query =
				req.user.type === privilageEnum.admin
					? { soldBy: req.user._id }
					: { comesUnder: req.user._id };
			const paginateOptions = {
				offset:
					req.query.offset &&
					!!Math.abs(req.query.offset) &&
					Math.abs(req.query.offset) > 0
						? Math.abs(req.query.offset)
						: undefined,
				page:
					req.query.page &&
					!!Math.abs(req.query.page) &&
					Math.abs(req.query.page) > 0
						? Math.abs(req.query.page)
						: undefined,
				limit:
					req.query.limit &&
					!!Math.abs(req.query.limit) &&
					Math.abs(req.query.limit) > 0
						? Math.abs(req.query.limit)
						: 10,
				populate: ["customer", "soldBy"],
				sort: req.query.sort || "",
				lean: true,
			};
			Bill.paginate(query, paginateOptions).then(
				(bills) => {
					if (bills !== null) {
						bills.docs = _.reject(bills.docs, ["customer", null]);
						return apiResponse.successResponseWithData(
							res,
							"Operation success",
							bills
						);
					} else {
						return apiResponse.successResponseWithData(
							res,
							"Operation success",
							[]
						);
					}
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
 * Get all Bills List created by salesmen under the admin.
 *
 * @returns [Object] {Object}
 */
exports.getBillsFromSalesmen = [
	auth,
	function (req, res) {
		try {
			//TODO: Aggregate to lookup to the salesmen of the admin.
			Bill.find({ soldBy: req.user._id }, (err, bills) => {
				if (err) return apiResponse.ErrorResponse(res, err);

				if (bills.length > 0) {
					return apiResponse.successResponseWithData(
						res,
						"Operation success",
						bills
					);
				} else {
					return apiResponse.successResponseWithData(
						res,
						"Operation success",
						[]
					);
				}
			});
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
	async function (req, res) {
		const validationError = validationResult(req);
		if (!validationError.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error for bill",
				validationError.array()
			);

		await CustomerModel.countDocuments({ _id: req.body.customerId })
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
				(populatedItems) => {
					req.body.items = populatedItems;
					const comesUnder =
						req.user.type === privilageEnum.admin
							? req.user._id
							: req.user.worksUnder;
					var newBill = new Bill({
						customer: req.body.customerId,
						items: req.body.items,
						discountAmount: req.body.discountAmount,
						soldBy: req.user._id,
						comesUnder,
					});
					newBill.itemsTotalAmount = newBill.calculateItemsTotalAmount();
					newBill.billAmount = newBill.calculateBillAmount();

					return newBill.save();
				},
				(err) => apiResponse.ErrorResponse(res, err.message)
			)
			.then(
				(bill) =>
					apiResponse.successResponseWithData(res, "Bill created", {
						id: bill.id,
					}),
				(err) =>
					apiResponse.ErrorResponse(
						res,
						"Error in saving the bill:" + err.message
					)
			);
	},
];

//For data analys
exports.itemsAndQuantities = [
	auth,
	function (req, res) {
		Bill.aggregate([
			{
				$unwind: {
					path: "$items",
				},
			},
			{
				$project: {
					_id: "$_id",
					itemName: "$items.name",
					itemRate: "$items.rate",
					itemMrp: "$items.mrp",
					itemCode: "$items.code",
					quantity: "$items.quantity",
					createdAt: "$createdAt",
				},
			},
			{
				$group: {
					_id: "$itemCode",
					itemCode: {
						$first: "$itemCode",
					},
					itemName: {
						$first: "$itemName",
					},
					itemRate: {
						$first: "$itemRate",
					},
					itemMrp: {
						$first: "$itemMrp",
					},
					quantity: {
						$sum: "$quantity",
					},
					billedAt: {
						$first: "$createdAt",
					},
				},
			},
			{
				$project: {
					name: "$itemName",
					code: "$itemCode",
					quantity: "$quantity",
					totalAmount: {
						$multiply: ["$quantity", "$itemRate"],
					},
					profit: {
						$subtract: [
							{
								$multiply: ["$quantity", "$itemMrp"],
							},
							{
								$multiply: ["$quantity", "$itemRate"],
							},
						],
					},
				},
			},
			{
				$sort: {
					profit: -1,
				},
			},
		]).exec((err, data) => {
			if (err) return apiResponse.ErrorResponse(res, err);
			return apiResponse.successResponseWithData(res, "Values of", data);
		});
	},
];

exports.customerAndPurchases = [
	auth,
	function (req, res) {
		Bill.aggregate([
			{
				$group: {
					_id: "$customer",
					totalAmount: {
						$sum: "$billAmount",
					},
				},
			},
			{
				$lookup: {
					from: "customers",
					localField: "_id",
					foreignField: "_id",
					as: "customerDetails",
				},
			},
			{
				$unwind: {
					path: "$customerDetails",
					preserveNullAndEmptyArrays: false,
				},
			},
			{
				$set: {
					customerName: "$customerDetails.name",
				},
			},
			{
				$sort: {
					totalAmount: -1,
				},
			},
		]).exec((err, data) => {
			if (err) return apiResponse.ErrorResponse(res, err);
			return apiResponse.successResponseWithData(res, "Values of", data);
		});
	},
];
