const Bill = require("../models/BillModel");
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");

var mongoose = require("mongoose");
const BillModel = require("../models/BillModel");

mongoose.set("useFindAndModify", false);

// Book Schema
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
exports.billsList = [
	auth,
	function (req, res) {
		if (req.user.type && req.user.type === "admin") {
			try {
				Bill.find().then((books) => {
					if (books.length > 0) {
						return apiResponse.successResponseWithData(res, "Operation success", books);
					} else {
						return apiResponse.successResponseWithData(res, "Operation success", []);
					}
				});
			} catch (err) {
				//throw error in json response with status 500. 
				return apiResponse.ErrorResponse(res, err);
			}
		} else {
			return apiResponse.unauthorizedResponse(res, "You are not allowed to do this operation");
		}
	}
];


/**
 * Get Bills List of the logged in user
 */

// exports.billsList = [
// 	auth,
// 	function (req, res) {
// 		try {
// 			Bill.find({ user: req.user._id }).then((books) => {
// 				if (books.length > 0) {
// 					return apiResponse.successResponseWithData(res, "Operation success", books);
// 				} else {
// 					return apiResponse.successResponseWithData(res, "Operation success", []);
// 				}
// 			});
// 		} catch (err) {
// 			//throw error in json response with status 500. 
// 			return apiResponse.ErrorResponse(res, err);
// 		}
// 	}
// ];

/**
 * Book Detail.
 * 
 * @param {string}      id
 * 
 * @returns {Object}
 */
exports.bookDetail = [
	auth,
	function (req, res) {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return apiResponse.successResponseWithData(res, "Operation success", {});
		}
		try {
			Book.findOne({ _id: req.params.id, user: req.user._id }, "_id title description isbn createdAt").then((book) => {
				if (book !== null) {
					let bookData = new BookData(book);
					return apiResponse.successResponseWithData(res, "Operation success", bookData);
				} else {
					return apiResponse.successResponseWithData(res, "Operation success", {});
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