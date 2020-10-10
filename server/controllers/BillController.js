const Bill = require("../models/BillModel");
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");

var mongoose = require("mongoose");
const BillModel = require("../models/BillModel");
const CustomerModel = require("../models/CustomerModel");

mongoose.set("useFindAndModify", false);

// Bill Schema
function BookData(data) {
	this.id = data._id;
	this.title = data.title;
	this.description = data.description;
	this.isbn = data.isbn;
	this.createdAt = data.createdAt;
}

/**
 * Get all Bills List.
 * Only available for admins
 * 
 * @returns {Object}
 */
exports.getAllBills = [
	auth,
	function (req, res) {
		try {
			Bill.find({}, (err, bills) => {
				if (err) return apiResponse.ErrorResponse(res, err);

				if (bills.length > 0) {
					return apiResponse.successResponseWithData(res, "Operation success", bills);
				} else {
					return apiResponse.successResponseWithData(res, "Operation success", []);
				}
			});
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
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
	body("customerId", "Not a valid Customer Id").trim().escape().isMongoId().withMessage("Error in customer id"),
	body("items", "Items list must be an array").isArray(),
	body("discountAmount", "Discount should be set").trim().escape().isNumeric(),
	async function (req, res) {
		const validationError = validationResult(req);
		if (!validationError.isEmpty()) return apiResponse.validationErrorWithData(res, "Validation Error for bill", validationError.array());

		await CustomerModel.countDocuments({ _id: req.body.customerId }).exec()
			.then((count) => {
				if (count === 0) {
					return apiResponse.notFoundResponse(res, "CustomerID not found");
				} else {
					return Bill.populateItemsWithQuantity(req.body.items);
				}
			}, (err) => apiResponse.ErrorResponse(res, "CustomerID error:" + err.message))
			.then((populatedItems) => {
				req.body.items = populatedItems;

				var newBill = new Bill({
					customer: req.body.customerId,
					items: req.body.items,
					discountAmount: req.body.discountAmount,
					soldBy: req.user._id
				});
				newBill.itemsTotalAmount = newBill.calculateItemsTotalAmount();
				newBill.billAmount = newBill.calculateBillAmount();
				
				return newBill.save();
			}, (err) => apiResponse.ErrorResponse(res, err.message))
			.then((bill) => apiResponse.successResponseWithData(res, "Bill created", { id: bill.id })
				, (err) => apiResponse.ErrorResponse(res, "Error in saving the bill:" + err.message));
	}
];

exports.bookStore = [
	auth,
	body("customerId", "customerId must not be empty.").isLength({ min: 1 }).trim(),
	body("items", "items List must not be empty.").isLength({ min: 1 }),
	body("discountAmount", "ISBN must not be empty").custom((value) => {
		if (value < 0) {
			return Promise.reject("discountAmount must not be negative");
		}
	}),
	sanitizeBody("*").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}

			return BillModel.parseClientSideBillData(req.body)
				.then(() => {
					const bill = new BillModel({
						...req.body
					});

					bill.soldBy = req.user._id;
					bill.calculateItemsTotalAmount();
					bill.calculateBillAmount();
					// TODO: Finish this save bill function and test
					bill.save((err) => {
						if (err) { return apiResponse.ErrorResponse(res, err); }
						return apiResponse.successResponseWithData(res, "Bill added", new BillModel(bill).lean());
					});
				}, (err) => {
					return apiResponse.ErrorResponse(res, err);
				});
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Book update.
 * 
 * @param {string}      title 
 * @param {string}      description
 * @param {string}      isbn
 * 
 * @returns {Object}
 */
exports.bookUpdate = [
	auth,
	body("title", "Title must not be empty.").isLength({ min: 1 }).trim(),
	body("description", "Description must not be empty.").isLength({ min: 1 }).trim(),
	body("isbn", "ISBN must not be empty").isLength({ min: 1 }).trim().custom((value, { req }) => {
		return Book.findOne({ isbn: value, user: req.user._id, _id: { "$ne": req.params.id } }).then(book => {
			if (book) {
				return Promise.reject("Book already exist with this ISBN no.");
			}
		});
	}),
	sanitizeBody("*").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			var book = new Book(
				{
					title: req.body.title,
					description: req.body.description,
					isbn: req.body.isbn,
					_id: req.params.id
				});

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
					return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
				} else {
					Book.findById(req.params.id, function (err, foundBook) {
						if (foundBook === null) {
							return apiResponse.notFoundResponse(res, "Book not exists with this id");
						} else {
							//Check authorized user
							if (foundBook.user.toString() !== req.user._id) {
								return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
							} else {
								//update book.
								Book.findByIdAndUpdate(req.params.id, book, {}, function (err) {
									if (err) {
										return apiResponse.ErrorResponse(res, err);
									} else {
										let bookData = new BookData(book);
										return apiResponse.successResponseWithData(res, "Book update Success.", bookData);
									}
								});
							}
						}
					});
				}
			}
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Book Delete.
 * 
 * @param {string}      id
 * 
 * @returns {Object}
 */
exports.bookDelete = [
	auth,
	function (req, res) {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
		}
		try {
			Book.findById(req.params.id, function (err, foundBook) {
				if (foundBook === null) {
					return apiResponse.notFoundResponse(res, "Book not exists with this id");
				} else {
					//Check authorized user
					if (foundBook.user.toString() !== req.user._id) {
						return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
					} else {
						//delete book.
						Book.findByIdAndRemove(req.params.id, function (err) {
							if (err) {
								return apiResponse.ErrorResponse(res, err);
							} else {
								return apiResponse.successResponse(res, "Book delete Success.");
							}
						});
					}
				}
			});
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];