const { body, param, query, validationResult } = require("express-validator");
const auth = require("../middlewares/jwt");
const apiResponse = require("../helpers/apiResponse");
const { Product } = require("../models/ProductModel");
const { privilegeEnum } = require("../helpers/privilegeEnum.js");
const unitSchemaValidation = require("./validators/unitsSchemaValidation");
const paginationLabels = require("../helpers/paginationLabels");
const { userData } = require("./AuthController");
const { ProductCategory } = require("../models/ProductCategoryModel");
const mognoose = require("mongoose");
const { User } = require("../models/UserModel");

//Types
function ProductData(data) {
	this._id = data._id;
	this.code = data.code;
	this.name = data.name;
	this.weight = data.weight;
	this.weightUnit = data.weightUnit;
	this.quantity = data.quantity;
	this.rate = data.rate;
	this.mrp = data.mrp;
	this.units = data.units || [];
}

function ProductCategoryData(data) {
	this._id = data._id;
	this.name = data.name;
	this.hasAccess = data.hasAccess;
}

/**
 * @typedef Unit
 * @type {object}
 * @param {string} name - Name of the Unit
 * @param {number} rate - Rate of the unit
 * @param {number} mrp - MRP of the Unit
 */

/**
 * @typedef NewProductData
 * @type {object}
 * @param {string} code - Unique code of the Product
 * @param {string} name - Name of the Product
 * @param {number} rate - Rate of the Product
 * @param {number} mrp - MRP of the Product
 * @param {ProductCategory._id} category - Product Category Id
 * @param {Unit[]=} units - Units array of the product
 */

//Functions 
/**
 * Parse the query params from client
 * @param {object} query 
 */
function QueryParser(query) {
	this.offset = Math.abs(parseInt(query.offset)) || 0;
	this.page = Math.abs(parseInt(query.page)) || 1;
	this.limit = Math.abs(parseInt(query.limit)) || 5;
	this.soldBy = query.soldBy;
	this.sort = query.sort;
	this.lean = true;
	this.populate = ["category", "belongsTo"]
}

/**
 * Check whether the authenticated user has access to the product
 * @param {User} authenticatedUser 
 * @param {Bill} paramProduct 
 * @param {string|string[]} explicitPermission 
 * @returns {boolean} 
 */
function hasAccessPermission(authenticatedUser, paramProduct, explicitPermission) {
	var flag = false;

	if (authenticatedUser.type === privilegeEnum.root) {
		flag = true;
	} else if (authenticatedUser && !paramProduct) {
		if (authenticatedUser.type === admin || (authenticatedUser.settings && authenticatedUser.settings.permissions.includes(explicitPermission))) {
			flag = true;
		}
	} else if (authenticatedUser._id === paramProduct.belongsTo._id) { //Belongs to User 
		if (authenticatedUser.type === privilegeEnum.admin) { // and user is admin
			flag = true;
		}
	} else if (authenticatedUser.belongsTo._id === paramProduct.belongsTo._id) { //Product and user belong to same admin
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
 * Check access permission of a ProductCategory
 * 
 * @param {User} authenticatedUser - Authenticated User Data Object
 * @param {ProductCategory._id} categoryId - Product Category Id
 * @param {string} explicitPermission - Any explicit permisssion for non-admins
 */
async function hasProductCategoryAccess(authenticatedUser, categoryId, explicitPermission) {
	var flag = false;

	const productCategory = await ProductCategory.findById(categoryId);
	if (productCategory.belongsTo === authenticatedUser._id && authenticatedUser.type === privilegeEnum.admin) {
		flag = true;
	} else if (productCategory.hasAccess.includes(authenticatedUser._id) && (authenticatedUser.settings && authenticatedUser.settings.permissions.includes(explicitPermission))) {
		flag = true;
	} else if (authenticatedUser.type === privilegeEnum.root) {
		flag = true;
	}

	return flag;
}

/**
 * Get a product by its Id
 * @param {Product._id} _id 
 */
async function getProductById(_id) {
	return Product.findById(_id)
		.populate("belongsTo")
		.populate("category")
		.exec()
}

/**
 * Create a new Product within the category id
 * 
 * @param {string} code - Unique code of the Product
 * @param {string} name - Name of the Product
 * @param {number} rate - Rate of the Product
 * @param {number} mrp - MRP of the Product
 * @param {ProductCategory._id} categoryId 
 * @param {Unit[]=} units - Units array of the product
 * @returns 
 */
async function createProduct(code, name, rate, mrp, categoryId, units) {
	try {
		if (units && units.length)
			units = unitSchemaValidation(
				rate,
				mrp,
				units
			);
		else units = []
	} catch (e) {
		return apiResponse.validationErrorWithData(
			res,
			"Validation error",
			e.message
		);
	}
	const productData = new Product({
		code: code,
		name: name,
		units: units,
		category: categoryId,
		rate: rate,
		mrp: mrp,
	})
	await productData.populate("belongsTo").populate("category").execPopulate();
	return await productData.save();
}

/**
 * Create a new Product Category
 * @param {string} name - Name of the category
 * @param {User._id} belongsTo - Admin UserID to whom the Category belongs to
 * @param {User._id[]} hasAccess - Who else has access
 * @returns {ProductCategory}
 */
async function createCategory(name, belongsTo, hasAccess) {
	const newCategory = new ProductCategory({
		name, belongsTo, hasAccess
	})

	return await newCategory.save()
}
exports.createCategory = createCategory;

/**
 * Insert multiple products within a Product Category
 * 
 * @param {NewProductData[]} newProductsArray - Array of New Products' data
 * @param {ProductCategory._id} categoryId - Product Category which those comes under
 */
async function addMultipleProducts(newProductsArray, categoryId) {
	for (let product of newProductsArray) {
		if (product.units && product.units.length)
			product.units = unitSchemaValidation(
				product.rate,
				product.mrp,
				product.units
			);
		product.category = categoryId;
	}

	const session = await Product.startSession();
	const count = await Product.countDocuments();

	await session.withTransaction(async () => {
		await Product.create(newProductsArray, { session });
	});

	const newCount = await Product.countDocuments();

	session.endSession();

	return { count: newCount - count }
}

/**
 * Delete the Product category by deleting all the Products within that category.
 * @param {ProductCategory._id} _id 
 * @returns {{deletedProductsCount:number}}
 */
async function deleteProductCategoryAndProducts(_id) {
	const session = await mognoose.startSession();
	var error;
	session.startTransaction();

	try {
		const deletedProducts = await Product.deleteMany({ category: _id }, { session });
		if (!deletedProducts.ok) {
			throw new Error("Couldn't delete products");
		}
		await ProductCategory.findByIdAndDelete(_id, { session });
		await session.commitTransaction();
		session.endSession();
		return { deletedProductsCount: deletedProducts.deletedCount };
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		throw e;
	}
}

// Middleswares
exports.createCategoryRequest = [
	auth,
	body("name")
		.trim()
		.escape()
		.isAlphanumeric()
		.bail()
		.custom((value, { req }) => {
			return ProductCategory
				.findOne({ belongsTo: req.user._id, name: value }, (err, res) => {
					if (err || res) return Promise.reject("This Product Category already present")
				})
		}),
	body("hasAccess")
		.optional()
		.isArray(),
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
			if (authenticatedUser.type === privilegeEnum.admin || authenticatedUser.type === privilegeEnum.root) {
				const newCategory = await createCategory(req.body.name, req.user._id, req.body.hasAccess || [])
				return apiResponse.successResponseWithData(res, "Product category created", { _id: newCategory._id.toString() })
			} else if (authenticatedUser.settings && authenticatedUser.settings.permissions.includes("ALLOW_PRODUCTCATEGORY_POST")) {
				const newCategory = await createCategory(req.body.name, authenticatedUser.belongsTo._id, req.body.hasAccess || [req.user._id])
				return apiResponse.successResponseWithData(res, "Product category created", { _id: newCategory._id.toString() })
			} else {
				return apiResponse.unauthorizedResponse(res, "You are not authorised to perform this action")
			}
		} catch (e) {
			return apiResponse.ErrorResponse(res, e.message || e);
		}
	}
]

exports.getProductCategoriesList = [
	auth,
	async (req, res) => {
		try {
			const authenticatedUser = await userData(req.user._id);
			if (authenticatedUser.type === privilegeEnum.admin || authenticatedUser.type === privilegeEnum.root ||
				(authenticatedUser.settings && authenticatedUser.settings.permissions.includes("ALLOW_PRODUCTCATEGORY_GET"))) {
				await ProductCategory.find({
					"$or": [
						{
							belongsTo: req.user._id
						},
						{
							hasAccess: req.user._id
						}
					]
				}).populate("belongsTo").populate("hasAccess").exec((err, docs) => {
					if (err) return apiResponse.ErrorResponse(req, err);
					return apiResponse.successResponseWithData(
						res,
						"Product Categories List",
						docs.map(productCategoryData => new ProductCategoryData(productCategoryData))
					)
				})
			} else {
				return apiResponse.unauthorizedResponse(res, "You are not authorised to perform this action")
			}
		} catch (e) {
			return apiResponse.ErrorResponse(res, e.message || e);
		}
	}
]

/**
 * To delete a bill created by the user.
 *
 * @param {Mongoose.Schema.Types.ObjectId} billId - ID of the bill to be deleted.
 */
exports.deleteProduct = [
	auth,
	param("categoryId", "Invalid Product Id").escape().trim().isMongoId(),
	param("productId", "Invalid Product Id").escape().trim().isMongoId(),
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
			const product = await getProductById(req.params.productId)

			if (product === null) {
				return apiResponse.notFoundResponse(
					res,
					"Product does not exist"
				);
			} else {
				if (hasAccessPermission(authenticatedUser, product, "ALLOW_PRODUCT_DELETE")) {
					return Product.findByIdAndRemove(req.params.productId, function (err) {
						if (err) {
							return apiResponse.ErrorResponse(res, err);
						} else {
							return apiResponse.successResponse(
								res,
								"Product deleted"
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
	}
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
exports.createProductRequest = [
	auth,
	param("categoryId", "Invalid category id")
		.escape().trim().isMongoId()
		.custom((value) =>
			ProductCategory.findById(value, (err, doc) => {
				if (err) Promise.reject(err);
				if (!doc) {
					return Promise.reject(
						"Product Category does not exists"
					)
				}
			})
		),
	body("code")
		.escape()
		.trim()
		.isAlphanumeric()
		.custom((value, { req }) =>
			Product.findOne({
				code: value,
				category: req.params.categoryId,
			}).then((doc) => {
				if (doc)
					return Promise.reject(
						"Item with this code already exists."
					);
			})
		),
	body("name").escape().isLength().trim().matches(/^[a-z0-9 ]+$/i),
	body("rate").escape().trim().isNumeric(),
	body("mrp").escape().trim().isNumeric(),
	body("units").optional().isArray(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error",
				errors.array()
			);
		try {
			const authenticatedUser = await userData(req.user._id);
			if (
				!hasAccessPermission(authenticatedUser, null, "ALLOW_PRODUCT_POST") ||
				!(await hasProductCategoryAccess(authenticatedUser, req.params.categoryId, "ALLOW_PRODUCTCATEGORY_GET"))
			)
				return apiResponse.unauthorizedResponse(
					res,
					"You are not authorised to add product"
				)
			const newProduct = await createProduct(
				req.body.code,
				req.body.name,
				req.body.rate,
				req.body.mrp,
				req.params.categoryId,
				req.body.units
			)
			return apiResponse.successResponseWithData(
				res,
				"Product Created",
				new ProductData(newProduct)
			)
		} catch (e) {
			return apiResponse.validationErrorWithData(
				res,
				"Product Creation Error",
				e.message || e
			);
		}
	}
];

exports.deleteProductCategory = [
	auth,
	param("categoryId", "Invalid category id")
		.escape().trim().isMongoId()
		.custom((value) =>
			ProductCategory.findById(value, (err, doc) => {
				if (err) Promise.reject(err);
				if (!doc) {
					return Promise.reject(
						"Product Category does not exists"
					)
				}
			})
		),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error",
				errors.array()
			);
		try {
			const authenticatedUser = await userData(req.user._id);
			if (
				!hasAccessPermission(authenticatedUser, null, "ALLOW_PRODUCTCATEGORY_DELETE") ||
				!(await hasProductCategoryAccess(authenticatedUser, req.params.categoryId, "ALLOW_PRODUCTCATEGORY_DELETE"))
			)
				return apiResponse.unauthorizedResponse(
					res,
					"You are not authorised to add product"
				)
			return deleteProductCategoryAndProducts(req.params.categoryId)
				.then(response => {
					return apiResponse.successResponseWithData(res, "Product Cateogory deleted", response);
				})
		} catch (e) {
			return apiResponse.validationErrorWithData(
				res,
				"Product Deletion Error",
				e.message || e
			);
		}
	}
]

/**
 * Bulk Import Products.
 *
 */
exports.importProducts = [
	auth,
	param("categoryId", "Invalid category id")
		.escape().trim().isMongoId()
		.custom((value) =>
			ProductCategory.findById(value, (err, doc) => {
				if (err) Promise.reject(err);
				if (!doc) {
					return Promise.reject(
						"Product Category does not exists"
					)
				}
			})
		),
	body("items").isArray(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error",
				errors.array()
			);
		try {
			const authenticatedUser = await userData(req.user._id);
			if (
				!hasAccessPermission(authenticatedUser, null, "ALLOW_PRODUCT_POST") ||
				!(await hasProductCategoryAccess(authenticatedUser, req.params.categoryId, "ALLOW_PRODUCTCATEGORY_GET"))
			) {
				return apiResponse.unauthorizedResponse(
					res,
					"You are not authorised for this operation"
				)
			}
			const { count } = await addMultipleProducts(req.body.items, req.params.categoryId);
			return apiResponse.successResponse(
				res,
				`Imported ${count} Products`
			)
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err.message || err);
		}
	},
];

/**
 * Update any fields of the product
 *
 * @param {Mongoose.Schema.Types.ObjectId} [id] - ID of the product to be updated.
 */
exports.updateProduct = [
	auth,
	param("categoryId")
		.escape()
		.trim()
		.isMongoId(),
	param("productId")
		.escape()
		.trim()
		.isMongoId(),
	body("code").optional().escape().trim().isAlphanumeric(),
	body("name").optional().escape().trim().matches(/^[a-z0-9 ]+$/i),
	body("rate").optional().escape().trim().isFloat({ min: 1 }),
	body("mrp").optional().escape().trim().isFloat({ min: 1 }),
	body("units").optional().isArray(),
	async (req, res) => {
		if (!validationResult(req).isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error.",
				validationResult(req).array()
			);
		try {
			//Check for product category access rights
			const authenticatedUser = await userData(_id);
			if (!(await hasProductCategoryAccess(authenticatedUser, req.params.categoryId, "ALLOW_PRODUCTCATEGORY_GET")))
				return apiResponse.unauthorizedResponse(res, "You are not authorised for this operation")

			const product = await Product.findById(req.params.id)
			if (product) {
				//Check for product modification rights
				if (!hasAccessPermission(authenticatedUser, product, "ALLOW_PRODUCT_PUT"))
					return apiResponse.unauthorizedResponse(res, "You are not authorised for this operation")

				if (Array.isArray(req.body.units)) {
					const units = unitSchemaValidation(
						req.body.rate || product.rate,
						req.body.mrp || product.mrp,
						req.body.units
					)
					product.units = units;
					await product.save();
				}

				//Remove Units array from change request body
				const execptUnits = Object.keys(req.body).reduce((acc, elem) => {
					if (elem !== "units") acc[elem] = obj[elem]
					return acc
				}, {})

				const updatedProduct = await Product.findByIdAndUpdate(req.body.productId, execptUnits, { new: true }).exec();

				return apiResponse.successResponseWithData(
					res,
					"Product Update Success",
					new ProductData(updatedProduct)
				)
			} else {
				return apiResponse.notFoundResponse(res, "Product not found");
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

/**
 * Update any fields of the Product Category
 *
 * @param {Mongoose.Schema.Types.ObjectId} [id] - ID of the product category to be updated.
 */
exports.updateProductCategory = [
	auth,
	param("categoryId")
		.escape()
		.trim()
		.isMongoId(),
	body("name").optional().escape().trim().matches(/^[a-z0-9 ]+$/i),
	body("hasAccess").optional().isArray(),
	async (req, res) => {
		if (!validationResult(req).isEmpty())
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error.",
				validationResult(req).array()
			);
		try {
			//Check for product category access rights
			const authenticatedUser = await userData(req.user._id);
			if (!(await hasProductCategoryAccess(authenticatedUser, req.params.categoryId, "ALLOW_PRODUCTCATEGORY_PUT")))
				return apiResponse.unauthorizedResponse(res, "You are not authorised for this operation")

			const productCategory = await ProductCategory.findById(req.params.categoryId)
			if (productCategory) {
				if (Array.isArray(req.body.hasAccess)) {
					for (let userId of req.body.hasAccess) {
						const user = await User.findOne({ belongsTo: productCategory.belongsTo, _id: userId }).exec();
						if (!user) return apiResponse.unauthorizedResponse(res, "You cannot add this user");
					}
					productCategory.hasAccess = req.body.hasAccess;
				}
				if (req.body.name) {
					productCategory.name = req.body.name;
				}
				await productCategory.save();
				return apiResponse.successResponse(
					res,
					"Product Category Update Success",
				)
			} else {
				return apiResponse.notFoundResponse(res, "Product Category not found");
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err.message);
		}
	},
];

/**
 * Get suggestions for the matching Product CODE.
 *
 * @param {string} code - Phrase or parts of a product's code
 * @returns {Products[]} products - Array of products that matches the code phrase
 */
exports.getProductSuggestions = [
	auth,
	param("categoryId")
		.escape()
		.trim()
		.isMongoId(),
	param("code").escape().trim().isAlphanumeric(),
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
			if (!(await hasProductCategoryAccess(authenticatedUser, req.params.categoryId, "ALLOW_PRODUCTCATEGORY_GET")))
				return apiResponse.unauthorizedResponse(
					res,
					"You are not authorised to access this product category"
				)

			return await Product.find(
				{
					code: {
						$regex: new RegExp(`${req.params.code}`, "i"),
					},
					category: req.params.categoryId,
				}).limit(10).lean().exec(
					(err, products) => {
						if (err) return apiResponse.ErrorResponse(res, err);
						if (products.length === 0)
							return apiResponse.successResponseWithData(
								res,
								`No suggestions for:${req.params.code}`,
								[]
							);
						return apiResponse.successResponseWithData(
							res,
							`Product Suggestions for:${req.params.code}`,
							products.map((product) => new ProductData(product))
						);
					}
				)
		} catch (e) {
			return apiResponse.ErrorResponse(res, e.message || e);
		}
	},
];

/**
 * Get Products List based on the query
 */
exports.queryProduct = [
	auth,
	param("categoryId")
		.escape()
		.trim()
		.isMongoId(),
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
			if (!(await hasProductCategoryAccess(authenticatedUser, req.params.categoryId, "ALLOW_PRODUCTCATEGORY_GET")))
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
							"code": {
								$regex: new RegExp(`${req.query.search}`, "i"),
							}
						},
					]
				}),
				category: req.params.categoryId,
			};

			const paginateOptions = {
				...(new QueryParser(req.query))
			};

			return Product.paginate(query, paginateOptions).then(
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
 * Get availibity for the Product CODE.
 *
 * @param {string} code - Product's code
 * @returns {boolean} availability - Availibility of the product code
 */
exports.productAvailability = [
	auth,
	param("code").escape().trim().isAlphanumeric(),
	param("categoryId")
		.escape()
		.trim()
		.isMongoId(),
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
			if (!(await hasProductCategoryAccess(authenticatedUser, req.params.categoryId, "ALLOW_PRODUCTCATEGORY_GET")))
				return apiResponse.unauthorizedResponse(res, "You are not authorised to do this operation")

			return Product.findOne(
				{
					code: req.params.code,
					category: req.params.categoryId,
				},
				(err, product) => {
					if (err) return apiResponse.ErrorResponse(res, err);
					return apiResponse.successResponseWithData(
						res,
						"Product code availibility",
						!(product)
					);
				}
			).lean();
		} catch (e) {
			apiResponse.ErrorResponse(res, e.message || e);
		}
	}
];

/**
 * Get a product details by its ID
 * @param {Mongoose.Schema.Types.ObjectId} id - ID of the product
 */
exports.getProduct = [
	auth,
	param("categoryId")
		.escape()
		.trim()
		.isMongoId(),
	param("productId")
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
			if (!(await hasProductCategoryAccess(authenticatedUser, req.params.categoryId, "ALLOW_PRODUCTCATEGORY_GET")))
				return apiResponse.unauthorizedResponse(res, "You are not authorised to do this operation")

			return Product.findOne({ _id: req.params.productId, category: req.params.categoryId }).then((product) => {
				if (product) {
					if (hasAccessPermission(authenticatedUser, product, "ALLOW_PRODUCT_GET")) {
						let productData = new ProductData(product);

						return apiResponse.successResponseWithData(
							res,
							"Operation success",
							productData
						);
					} else {
						return apiResponse.unauthorizedResponse(
							res,
							"Not authorised to access this product"
						)
					}
				} else {
					return apiResponse.notFoundResponse(
						res,
						"No product Found"
					);
				}
			});
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	},
];
