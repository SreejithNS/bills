const { Customer } = require("../models/CustomerModel");
const { Bill } = require("../models/BillModel");
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
 * Abstract Locatoin Data from Document
 * @param {object} data 
 */
function LocationData(data) {
	this.type = data.type;
	this.coordinates = data.coordinates;
}

/**
 * Abstract Customer Data from Customer Document
 * @param {object} data 
 */
function CustomerData(data) {
	this._id = data._id;
	this.name = data.name;
	this.place = data.place;
	this.phone = data.phone;
	this.location = data.location ? new LocationData(data.location) : data.location;
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
	} else if (authenticatedUser._id === paramCustomer.belongsTo._id.toString()) { //Belongs to User 
		if (authenticatedUser.type === privilegeEnum.admin) { // and user is admin
			flag = true;
		}
	} else if (authenticatedUser.belongsTo._id === paramCustomer.belongsTo._id.toString()) { //Customer and user belong to same admin
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
 * @param {string} phone - Phone number of the customer
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
 * Delete the Customer by deleting all the bills from that customer.
 * @param {Customer._id} _id 
 * @returns {{deletedBillsCount:number}}
 */
async function deleteCustomerAndBills(_id) {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const deletedBills = await Bill.deleteMany({ customer: _id }, { session });
		if (!deletedBills.ok) {
			throw new Error("Couldn't delete bills");
		}
		await Customer.findByIdAndDelete(_id, { session });
		await session.commitTransaction();
		session.endSession();
		return { deletedBillsCount: deletedBills.deletedCount };
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		throw e;
	}
}

/**
 * Aggregate customer data
 * @param {string} _id 
 * @returns 
 */
async function aggregateCustomerData(_id) {
	return await Bill.aggregate(
		[
			{
				'$facet': {
					'byCredit': [
						{
							'$match': {
								'customer': mongoose.Types.ObjectId(_id)
							}
						}, {
							'$group': {
								'_id': '$credit',
								'totalBillAmount': {
									'$sum': '$billAmount'
								},
								'totalPaidAmount': {
									'$sum': '$paidAmount'
								},
								'averageBillAmount': {
									'$avg': '$billAmount'
								},
								'count': {
									'$sum': 1
								}
							}
						}
					]
				}
			}, {
				'$addFields': {
					'totalBillAmount': {
						'$sum': '$byCredit.totalBillAmount'
					},
					'totalPaidAmount': {
						'$sum': '$byCredit.totalPaidAmount'
					},
					'averageBillAmount': {
						'$avg': '$byCredit.averageBillAmount'
					}
				}
			}
		]
	).exec();
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
						},
						{
							"phone": {
								$regex: new RegExp(`${req.query.search}`, "i"),
							}
						}
					]
				}),
				belongsTo: mongoose.Types.ObjectId(authenticatedUser.belongsTo ? authenticatedUser.belongsTo._id : authenticatedUser._id)
			};

			const paginateOptions = {
				...(new QueryParser(req.query))
			};

			let agg = Customer.aggregate([
				{
					'$match': query
				}, {
					'$lookup': {
						'from': 'bills',
						'localField': '_id',
						'foreignField': 'customer',
						'as': 'bill'
					}
				}, {
					'$unwind': {
						'path': '$bill',
						preserveNullAndEmptyArrays: true
					}
				}, {
					'$sort': {
						'bill.createdAt': -1
					}
				}, {
					'$sort': {
						'bill.createdAt': -1
					}
				}, {
					'$group': {
						'_id': '$_id',
						'doc': {
							'$first': '$$ROOT'
						},
						'recentBillCreatedAt': {
							'$first': '$bill.createdAt'
						}
					}
				}, {
					'$replaceRoot': {
						'newRoot': {
							'$mergeObjects': [
								{
									'recentBillCreatedAt': '$recentBillCreatedAt'
								}, '$doc'
							]
						}
					}
				}
			])

			return Customer.aggregatePaginate(agg, paginateOptions).then(
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
				return apiResponse.unauthorizedResponse(
					res,
					"You are not authorised to do this operation"
				)

			const customer = await Customer.findOne({ _id: req.params.customerId, category: req.params.categoryId }).exec();

			if (customer) {
				if (hasAccessPermission(authenticatedUser, customer, "ALLOW_CUSTOMER_GET")) {
					let customerData = new CustomerData(customer);
					let aggregateData = await aggregateCustomerData(customer._id);
					return apiResponse.successResponseWithData(
						res,
						"Operation success",
						Object.assign(customerData, aggregateData.pop())
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
		} catch (err) {
			return apiResponse.ErrorResponse(res, err.meesage);
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
		.isNumeric()
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
	body("place", "Invalid place name").optional().trim().escape().matches(/^[a-z0-9 ]+$/i),
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
				const report = await deleteCustomerAndBills(req.params.customerId);
				return apiResponse.successResponse(
					res,
					`Customer along with their ${report.deletedBillsCount} bill(s) deleted.`
				);
			}
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
		.isNumeric()
		.withMessage("Phone must be 10 digits.")
		.custom(async (value, { req }) => {
			const authenticatedUser = await userData(req.user._id);
			if (!hasAccessPermission(authenticatedUser, null, "ALLOW_CUSTOMER_GET")) {
				return Promise.reject("You dont have permission");
			}
			return Customer.findOne(
				{
					_id: {
						$nin: [req.params.customerId]
					},
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
	body("place", "Invalid place name").optional().trim().escape().matches(/^[a-z0-9 ]+$/i),
	body("location", "Invalid coordinates")
		.optional()
		.custom((value) => {
			const [lat, lon] = value.coordinates;
			const reg = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
			return reg.test(lat + "," + lon);
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
			const authenticatedUser = await userData(req.user._id);
			const customer = await Customer.findById(req.params.customerId)

			if (!hasAccessPermission(authenticatedUser, customer, "ALLOW_CUSTOMER_PUT"))
				return apiResponse.unauthorizedResponse(res, "You are not authorised for this operation");

			//Select only valid keys from object;
			const editValues = _.pick(req.body, "name", "phone", "place", "location");

			const newCustomer = await Customer.findByIdAndUpdate(req.params.customerId, editValues, { new: true }).populate("belongsTo").exec();
			return apiResponse.successResponseWithData(
				res,
				"Customer Update Success",
				new CustomerData(newCustomer)
			)
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err.message);
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
					"You are not authorised to access Customers"
				)

			let belongsTo;
			if (authenticatedUser.type === privilegeEnum.admin | authenticatedUser.type === privilegeEnum.root) {
				belongsTo = authenticatedUser._id;
			} else {
				belongsTo = authenticatedUser.belongsTo._id;
			}

			return Customer.find(
				{
					name: {
						$regex: new RegExp(`${req.params.name}`, "i"),
					},
					belongsTo
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
