const { Customer } = require("../models/CustomerModel");
const { body, param, query, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
const { privilegeEnum } = require("../helpers/privilegeEnum");
mongoose.set("useFindAndModify", false);
const _ = require("lodash");
const { UserData, userData } = require("../controllers/AuthController");

//Types
/**
 * @typedef Location
 * @type {object}
 * @param {"Point"} type - Type of GeoData
 * @param {number[]} coordinates - Lat and Lon of the location
 */

//Functions
/**
 * Abstract Customer Data from Customer Document
 * @param {object} data 
 */
function CustomerData(data) {
	this._id = data._id;
	this.name = data.name;
	this.place = data.place;
	this.phone = data.phone;
	this.location = data.location;
	this.belongsTo = new UserData(data.belongsTo);
}

/**
 * Parse the query params from client
 * @param {object} query 
 */
function QueryParser(query) {
	this.page = Math.abs(parseInt(query.page)) || 1;
	this.limit = Math.abs(parseInt(query.limit)) || 5;
	this.sort = query.sort;
	this.lean = true;
	this.populate = ["belongsTo"]
}

/**
 * Check whether the authenticated user has access to the customer
 * @param {User} authenticatedUser 
 * @param {Customer} paramCustomer 
 * @param {string|string[]} explicitPermission 
 * @returns {boolean} 
 */
function hasAccessPermission(authenticatedUser, paramCustomer, explicitPermission) {
	var flag = false;

	if (authenticatedUser.type === privilegeEnum.root) {
		flag = true;
	} else if (authenticatedUser && !paramCustomer) {
		if (authenticatedUser.type === privilegeEnum.admin || (authenticatedUser.settings && authenticatedUser.settings.permissions.includes(explicitPermission))) {
			flag = true;
		}
	} else if (authenticatedUser._id === paramCustomer.belongsTo._id) { //Belongs to User 
		if (authenticatedUser.type === privilegeEnum.admin) { // and user is admin
			flag = true;
		}
	} else if (authenticatedUser.belongsTo._id === paramCustomer.belongsTo._id) { //Customer and user belong to same admin
		if (authenticatedUser.type === privilegeEnum.admin) { // and user is admin
			flag = true;
		} else if (authenticatedUser.settings && authenticatedUser.settings.permissions.includes(explicitPermission)) {
			// and user has explicit permission
			flag = true;
		}
	}

	if (!flag) throw new Error("User is not authorised to access this data");
	return flag;
}

/**
 * Creates customer entry to the database
 * 
 * @param {string} name - Name of the customer
 * @param {number} phone - Phone number of the customer
 * @param {User._id} belongsTo - AdminID of the user belonging to
 * @param {string=} place - Place where customer is located
 * @param {Location} location - GeoData of the customer
 */
async function createCustomer(name, phone, belongsTo, place, location) {
	const newCustomer = new Customer({ name, phone, belongsTo });

	place && Object.assign(newCustomer, { place });

	location && Object.assign(newCustomer, {
		type: "Point",
		coordinates: [
			location.lat,
			location.lat,
		].map(parseFloat),
	});

	await newCustomer.save()
	return newCustomer.populate("belongsTo");
}

/**
 * Get all Customers Created by user.
 * @returns {Object}
 */
exports.getAll = [
	auth,
	query(["page", "limit", "offset"])
		.optional()
		.isInt(),
	query("search")
		.optional()
		.trim()
		.escape(),
	async (req, res) => {
		const validation = validationResult(req);
		if (!validation.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error",
				validation.array()
			);

		try {
			const authenticatedUser = await userData(req.user._id);
			//Check product category access
			if (!hasAccessPermission(authenticatedUser, null, "ALLOW_CUSTOMER_GET"))
				return apiResponse.unauthorizedResponse(res, "You are not authorised to do this operation")

			const query = {
				...(req.query.search && {
					$or: [
						{
							"name": {
								$regex: new RegExp(`${req.query.search}`, "i"),
							}
						},
						{
							"place": {
								$regex: new RegExp(`${req.query.search}`, "i"),
							}
						}
					]
				}),
				belongsTo: authenticatedUser.belongsTo ? authenticatedUser.belongsTo._id : authenticatedUser._id
			};

			const paginateOptions = {
				...(new QueryParser(req.query))
			};

			return Customer.paginate(query, paginateOptions).then(
				(items) => apiResponse.successResponseWithData(
					res,
					"Operation success",
					items
				)
				,
				(err) => apiResponse.ErrorResponse(res, err.message)
			);
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err.message);
		}
	},
];

/**
 * Get Customer Details.
 *
 * Get the details of the customer with their _id
 * @param {string} id
 *
 * @returns {Object}
 */
exports.get = [
	auth,
	param("customerId")
		.escape()
		.trim()
		.isMongoId(),
	async function (req, res) {
		const validation = validationResult(req);
		if (!validation.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error",
				validation.array()
			);

		try {
			const authenticatedUser = await userData(req.user._id);
			//Check product category access
			if (!(await hasAccessPermission(authenticatedUser, null, "ALLOW_CUSTOMER_GET")))
				return apiResponse.unauthorizedResponse(res, "You are not authorised to do this operation")

			return Customer.findOne({ _id: req.params.customerId, category: req.params.categoryId }).then((customer) => {
				if (customer) {
					if (hasAccessPermission(authenticatedUser, customer, "ALLOW_CUSTOMER_GET")) {
						let customerData = new CustomerData(customer);

						return apiResponse.successResponseWithData(
							res,
							"Operation success",
							customerData
						);
					} else {
						return apiResponse.unauthorizedResponse(
							res,
							"Not authorised to access this customer"
						)
					}
				} else {
					return apiResponse.notFoundResponse(
						res,
						"No customer Found"
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
 * Create customer middlwares
 */
exports.create = [
	auth,
	body("name", "Name must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Name must be specified.")
		.matches(/^[a-z0-9 ]+$/i)
		.withMessage("Name must contain only alphanumeric and spaces"),
	body("phone", "Phone Number must not be empty")
		.trim()
		.isLength({ min: 10, max: 10 })
		.isInt()
		.withMessage("Phone must be 10 digits.")
		.custom(async (value, { req }) => {
			const authenticatedUser = await userData(req.user._id);
			if (!hasAccessPermission(authenticatedUser, null, "ALLOW_CUSTOMER_GET")) {
				return Promise.reject("You dont have permission");
			}
			return Customer.findOne(
				{
					phone: value,
					belongsTo: authenticatedUser.belongsTo ? authenticatedUser.belongsTo._id : authenticatedUser._id
				}
			).then(
				(customer) => {
					if (customer) {
						return Promise.reject("Phone Number already taken");
					}
				}
			);
		}),
	body("place", "Invalid place name").optional().trim().escape().isAlphanumeric(),
	body("coordinates", "Invalid coordinates")
		.optional()
		.custom(({ lat, lon }) => {
			const reg = /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}/;
			return reg.exec(lat) && reg.exec(lon);
		}),
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
			if (!hasAccessPermission(authenticatedUser, null, "ALLOW_CUSTOMER_POST")) {
				return apiResponse.unauthorizedResponse(res, "Not authorised for this operation");
			}

			const newCustomer = await createCustomer(
				req.body.name,
				req.body.phone,
				authenticatedUser.belongsTo ? authenticatedUser.belongsTo._id : authenticatedUser._id,
				req.body.place,
				req.body.location
			)

			//Save Customer.
			return newCustomer.save(function (err) {
				if (err) {
					return apiResponse.ErrorResponse(res, err);
				}
				let customerData = new CustomerData(newCustomer);
				return apiResponse.successResponseWithData(
					res,
					"Customer add Success.",
					customerData
				);
			});
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err.message);
		}
	},
];

/** 
 * Customer update.
 * 
 * @returns {Object}
 *
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
//

/** 
 * Customer Delete.
 * Only Admins are allowed to delete
 * 
 * @param {string}     [id] 
 * 
 * @returns {Object}
 */

exports.deleteCustomer = [
	auth,
	param("customerId", "Invalid Customer Id").escape().trim().isMongoId(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error.",
				errors.array()
			);
		try {
			const authenticatedUser = await userData(req.user._id);
			const customer = await Customer.findById(req.params.customerId);

			if (!hasAccessPermission(authenticatedUser, customer, "ALLOW_CUSTOMER_DELETE")) {
				return apiResponse.unauthorizedResponse(res, "Operation not allowed");
			}

			if (customer === null) {
				return apiResponse.notFoundResponse(
					res,
					"Customer does not exist"
				);
			} else {
				if (hasAccessPermission(authenticatedUser, customer, "ALLOW_CUSTOMER_DELETE")) {
					return Customer.findByIdAndRemove(req.params.id, function (err) {
						if (err) {
							return apiResponse.ErrorResponse(res, err);
						} else {
							return apiResponse.successResponse(
								res,
								"Customer deleted"
							);
						}
					});
				} else {
					return apiResponse.unauthorizedResponse(res, "Not authorised for this action");
				}
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

/**
 * Customer update.
 *
 * @returns {Object}
 */

exports.update = [
	auth,
	param("customerId")
		.escape()
		.trim()
		.isMongoId(),
	body("name", "Name must not be empty.")
		.optional()
		.trim()
		.isLength({ min: 1 })
		.withMessage("Name must be specified.")
		.matches(/^[a-z0-9 ]+$/i)
		.withMessage("Name must contain only alphanumeric and spaces"),
	body("phone", "Phone Number must not be empty")
		.optional()
		.trim()
		.isLength({ min: 10, max: 10 })
		.isInt()
		.withMessage("Phone must be 10 digits.")
		.custom(async (value, { req }) => {
			const authenticatedUser = await userData(req.user._id);
			if (!hasAccessPermission(authenticatedUser, null, "ALLOW_CUSTOMER_GET")) {
				return Promise.reject("You dont have permission");
			}
			return Customer.findOne(
				{
					phone: value,
					belongsTo: authenticatedUser.belongsTo ? authenticatedUser.belongsTo._id : authenticatedUser._id
				}
			).then(
				(customer) => {
					if (customer) {
						return Promise.reject("Phone Number already taken");
					}
				}
			);
		}),
	body("place", "Invalid place name").optional().trim().escape().isAlphanumeric(),
	body("coordinates", "Invalid coordinates")
		.optional()
		.custom(({ lat, lon }) => {
			const reg = /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}/;
			return reg.exec(lat) && reg.exec(lon);
		}),
	async (req, res) => {
		if (!validationResult(req).isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error.",
				validationResult(req).array()
			);
		try {
			//Check for customer category access rights
			const authenticatedUser = await userData(_id);
			const customer = await Product.findById(req.params.customerId)

			if (!hasAccessPermission(authenticatedUser, customer, "ALLOW_CUSTOMER_PUT"))
				return apiResponse.unauthorizedResponse(res, "You are not authorised for this operation")

			//Remove belongsTo from change request body
			const execptBelonsTo = Object.keys(req.body).reduce((acc, elem) => {
				if (elem !== "belongsTo") acc[elem] = obj[elem]
				return acc
			}, {})

			const newCustomer = await Customer.findByIdAndUpdate(req.body.customerId, execptBelonsTo, { new: true }).populate("belongsTo").exec();
			return apiResponse.successResponseWithData(
				res,
				"Customer Update Success",
				new CustomerData(newCustomer)
			)
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

/**
 * Get suggestions from parts of name
 *
 * @returns {Object[]}
 */
exports.getSuggestions = [
	auth,
	param("name", "Name must not be empty.")
		.optional()
		.trim()
		.isLength({ min: 1 })
		.withMessage("Name must be specified.")
		.matches(/^[a-z0-9 ]+$/i)
		.withMessage("Name must contain only alphanumeric and spaces"),
	async (req, res) => {
		const validation = validationResult(req);
		if (!validation.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error",
				validation.array()
			);

		try {
			const authenticatedUser = await userData(req.user._id);
			if (!(await hasAccessPermission(authenticatedUser, null, "ALLOW_CUSTOMER_GET")))
				return apiResponse.unauthorizedResponse(
					res,
					"You are not authorised to access this product category"
				)

			return Customer.find(
				{
					name: {
						$regex: new RegExp(`${req.params.name}`, "i"),
					},
				}).limit(10).lean().exec(
					(err, customers) => {
						if (err) return apiResponse.ErrorResponse(res, err);
						if (customers.length === 0)
							return apiResponse.successResponseWithData(
								res,
								`No suggestions for ${req.params.name}`,
								[]
							);
						return apiResponse.successResponseWithData(
							res,
							`Customers with name: ${req.params.name}`,
							customers.map((customer) => new CustomerData(customer))
						);
					}
				);
		} catch (e) {
			return apiResponse.ErrorResponse(res, e.message || e);
		}
	},
];
