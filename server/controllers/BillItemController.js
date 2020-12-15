const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const auth = require("../middlewares/jwt");
const _ = require("lodash");
const apiResponse = require("../helpers/apiResponse");
const Product = require("../models/ProductModel");
const privilegeEnum = require("../helpers/privilegeEnum.js");
const unitSchemaValidation = require("./validators/unitsSchemaValidation");

function ProductData(data) {
	this.id = data._id;
	this.code = data.code;
	this.name = data.name;
	this.weight = data.weight;
	this.weightUnit = data.weightUnit;
	this.quantity = data.quantity;
	this.rate = data.rate;
	this.mrp = data.mrp;
}

/**
 * To delete a bill created by the user.
 *
 * @param {Mongoose.Schema.Types.ObjectId} billId - ID of the bill to be deleted.
 */
exports.delete = [
	auth,
	(req, res) => {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return apiResponse.validationErrorWithData(
				res,
				"Invalid Error.",
				"Invalid ID"
			);
		}
		try {
			Product.findById(req.params.id, function (err, foundProduct) {
				if (foundProduct === null) {
					return apiResponse.notFoundResponse(
						res,
						"Product not exists with this id"
					);
				} else {
					//Check authorized user
					//delete Product.
					Product.findByIdAndRemove(req.params.id, function (err) {
						if (err) {
							return apiResponse.ErrorResponse(res, err);
						} else {
							return apiResponse.successResponse(
								res,
								"Product delete Success."
							);
						}
					});
				}
			});
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

/**
 * Create a Product.
 *
 * @param {string} name - Name of the product.
 * @param {string} code - Unique Code of the product.
 * @param {number} rate - Rate of the product.
 * @param {number} mrp - MRP of the product.
 * @param {number} [weight] - Weight of the product.
 * @param {string} weightUnit - Unit of weight/quantity of the product. For eg. kg, g, pkt, box.
 */
exports.create = [
	auth,
	body("category", "Invalid category name").optional().escape().trim(),
	body("code")
		.escape()
		.isLength()
		.trim()
		.isAlphanumeric()
		.custom((value, { req }) => {
			return Product.findOne({
				code: value,
				category: req.body.category,
			}).then((doc) => {
				if (doc)
					return Promise.reject(
						"Item with this code already exists."
					);
			});
		}),
	body("name").escape().isLength().trim(),
	body("rate").escape().trim().isNumeric(),
	body("mrp").escape().trim().isNumeric(),
	body("units").optional().isArray(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!/^[a-z0-9 ]+$/i.test(req.body.name))
				return apiResponse.validationErrorWithData(
					res,
					"Validation Error",
					"name is not alphanumeric"
				);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(
					res,
					"Validation Error",
					errors.array()
				);
			} else {
				try {
					if (req.body.units)
						req.body.units = unitSchemaValidation(
							req.body.rate,
							req.body.mrp,
							req.body.units
						);
				} catch (e) {
					return apiResponse.validationErrorWithData(
						res,
						"Validation error",
						e.message
					);
				}
				let newProduct = new Product(
					_.pickBy(
						{
							code: req.body.code,
							name: req.body.name,
							units: req.body.units || [],
							category: req.body.category || "general",
							rate: req.body.rate,
							mrp: req.body.mrp,
						},
						_.identity
					)
				);

				//Save Product.
				newProduct.save(function (err) {
					if (err) {
						return apiResponse.ErrorResponse(res, err);
					}
					let productData = new ProductData(newProduct);
					return apiResponse.successResponseWithData(
						res,
						"Product add Success.",
						productData
					);
				});
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

/**
 * Update any fields of the product
 *
 * @param {Mongoose.Schema.Types.ObjectId} [id] - ID of the product to be updated.
 */
exports.update = [
	//If I do this do I not need to verify later?
	auth,
	body("code").optional().escape().trim().isAlphanumeric(),
	body("name").optional().escape().trim(),
	body("rate").optional().escape().trim().isNumeric(),
	body("mrp").optional().escape().trim().isNumeric(),
	body("weight").optional().escape().trim().isNumeric(),
	body("weightUnit").optional().escape().trim().isAlphanumeric(),
	function (req, res) {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return apiResponse.validationErrorWithData(
				res,
				"Invalid Product ID",
				{}
			);
		}
		if (!validationResult(req).isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error.",
				validationResult(req).array()
			);

		try {
			//Schema doesn't have phone?
			//Do we need updatedAt?

			Product.findById(req.params.id).then((product) => {
				if (product !== null) {
					for (let key of Object.keys(req.body)) {
						product[key] = req.body[key];
					}

					product.save(function (err) {
						if (err) {
							return apiResponse.ErrorResponse(res, err);
						}
						return apiResponse.successResponseWithData(
							res,
							"Product update Success.",
							JSON.parse(JSON.stringify(new ProductData(product)))
						);
					});
				} else {
					return apiResponse.successResponseWithData(
						res,
						"Operation success: No Product Found",
						{}
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
 * Get suggestions for the matching Product CODE.
 *
 * @param {string} code - Phrase or parts of a product's code
 * @returns {Products[]} products - Array of products that matches the code phrase
 */
exports.getSuggestions = [
	auth,
	param("code").escape().trim(),
	(req, res) => {
		const validation = validationResult(req);
		if (!validation.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error",
				validation.array()
			);

		Product.find(
			{
				code: {
					$regex: new RegExp(`${req.params.code}`, "i"),
				},
			},
			(err, products) => {
				if (err) return apiResponse.ErrorResponse(res, err);
				if (products.length === 0)
					return apiResponse.successResponseWithData(
						res,
						`No suggestions for ${req.params.code}`,
						[]
					);
				return apiResponse.successResponseWithData(
					res,
					`Products with code ${req.params.code}`,
					products.map((product) => new ProductData(product))
				);
			}
		).lean();
	},
];

/**
 * Get  Bills List created by the user based on query received.
 *
 * @returns [Object] {Object}
 */
exports.query = [
	auth,
	function (req, res) {
		try {
			if (req.user.type !== privilegeEnum.admin)
				return apiResponse.unauthorizedResponse(
					res,
					"You are not authorised to do this operation"
				);
			const query = {
				name: {
					$regex: new RegExp(`${req.query.search}`, "i"),
				},
			}; // comesUnder: req.user._id };

			const paginateOptions = {
				page:
					req.query.page &&
					!!Math.abs(req.query.page) &&
					Math.abs(req.query.page) > 0
						? Math.abs(req.query.page)
						: 1,
				limit:
					req.query.limit &&
					!!Math.abs(req.query.limit) &&
					Math.abs(req.query.limit) > 0
						? Math.abs(req.query.limit)
						: 5,
				sort: req.query.sort || "",
				lean: true,
			};
			Product.paginate(query, paginateOptions).then(
				(items) => {
					if (items !== null) {
						return apiResponse.successResponseWithData(
							res,
							"Operation success",
							items
						);
					} else {
						return apiResponse.successResponseWithData(
							res,
							"Operation success: No data",
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
 * Get availibity for the Product CODE.
 *
 * @param {string} code - Product's code
 * @returns {boolean} availability - Availibility of the product code
 */
exports.productAvailability = [
	auth,
	param("code").escape().trim(),
	(req, res) => {
		if (req.user.type !== privilegeEnum.admin)
			return apiResponse.unauthorizedResponse(
				res,
				"You are not authorised to do this operation"
			);
		Product.find(
			{
				code: req.params.code,
			},
			(err, products) => {
				if (err) return apiResponse.ErrorResponse(res, err);
				return apiResponse.successResponseWithData(
					res,
					"Product code availibility",
					!(products.length === 0)
				);
			}
		).lean();
	},
];

/**
 * Get a product details by its ID
 *
 * @param {Mongoose.Schema.Types.ObjectId} id - ID of the product
 */
exports.get = [
	auth,
	function (req, res) {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return apiResponse.validationErrorWithData(
				res,
				"Invalid Product ID",
				{}
			);
		}
		try {
			Product.findById(req.params.id).then((product) => {
				if (product !== null) {
					let productData = new ProductData(product);
					return apiResponse.successResponseWithData(
						res,
						"Operation success",
						productData
					);
				} else {
					return apiResponse.successResponseWithData(
						res,
						"Operation success: No product Found",
						{}
					);
				}
			});
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];
