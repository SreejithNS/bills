const { body, param, query, validationResult } = require("express-validator");
const auth = require("../middlewares/jwt");
const apiResponse = require("../helpers/apiResponse");
const { Product } = require("../models/ProductModel");
const { privilegeEnum } = require("../helpers/privilegeEnum.js");
const unitSchemaValidation = require("./validators/unitsSchemaValidation");
const { userData } = require("./AuthController");
const { ProductCategory } = require("../models/ProductCategoryModel");
const mognoose = require("mongoose");
const { User } = require("../models/UserModel");
const Papa = require("papaparse");

//Types
function ProductData(data) {
	this._id = data._id;
	this.code = data.code;
	this.name = data.name;
	this.cost = data.cost;
	this.stock = data.stock;
	this.stocked = data.stocked;
	this.quantity = data.quantity;
	this.rate = data.rate;
	this.mrp = data.mrp;
	this.units = data.units || [];
	this.belongsTo = data.belongsTo;
	this.primaryUnit = data.primaryUnit || "Unit";
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
 * @param {number} cost - Cost of the Unit
 * @param {number} conversion - Conversion of the Unit to primary unit
 */

/**
 * @typedef NewProductData
 * @type {object}
 * @param {string} code - Unique code of the Product
 * @param {string} name - Name of the Product
 * @param {number} rate - Rate of the Product
 * @param {number} mrp - MRP of the Product
 * @param {number} cost - Cost of the Product
 * @param {string="Unit"} primaryUnit - Primary Unit of the Product
 * @param {boolean} stocked - is the product being Stocked or not
 * @param {number=0} initialStock - Initial Stock of the Product
 * @param {ProductCategory._id} category - Product Category Id
 * @param {Unit[]=} units - Units array of the product
 */

//Functions 
/**
 * Parse the query params from client
 * @param {object} query 
 */
function QueryParser(query) {
	this.page = Math.abs(parseInt(query.page)) || 1;
	this.limit = Math.abs(parseInt(query.limit)) || 5;
	this.soldBy = query.soldBy;
	this.sort = query.sort;
	this.lean = true;
	this.populate = ["category", "belongsTo"];
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
		if (authenticatedUser.type === privilegeEnum.admin || (authenticatedUser.settings && authenticatedUser.settings.permissions.includes(explicitPermission))) {
			flag = true;
		}
	} else if (authenticatedUser._id === paramProduct.belongsTo._id.toString()) { //Belongs to User 
		if (authenticatedUser.type === privilegeEnum.admin) { // and user is admin
			flag = true;
		}
	} else if (authenticatedUser.belongsTo._id === paramProduct.belongsTo._id.toString()) { //Product and user belong to same admin
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
	if (productCategory.belongsTo.toString() === authenticatedUser._id && authenticatedUser.type === privilegeEnum.admin) {
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
		.populate(["belongsTo", "category"]);
}

/**
 * Get a product by its Id and category
 * @param {Product._id} _id 
 */
async function getProductByIdAndCategory(_id, categoryId) {
	return Product.findOne({ _id: _id, category: categoryId })
		.populate(["belongsTo", "category"]);
}

/**
 * Create a new Product within the category id
 * 
 * @param {string} code - Unique code of the Product
 * @param {string} name - Name of the Product
 * @param {number} rate - Rate of the Product
 * @param {number} mrp - MRP of the Product
 * @param {number} cost - Cost of the Product
 * @param {string="Unit"} primaryUnit - Primary Unit of the Product
 * @param {boolean} stocked - is the product being Stocked or not
 * @param {number=0} initialStock - Initial Stock of the Product
 * @param {ProductCategory._id} categoryId 
 * @param {Unit[]=} units - Units array of the product
 * @returns 
 */
async function createProduct(code, name, primaryUnit = "Unit", rate, mrp, cost = 0, stocked = false, initialStock = 0, categoryId, units, user) {
	if (units && units.length)
		units = unitSchemaValidation(
			rate,
			mrp,
			units,
			cost
		);
	else units = [];
	const productData = new Product({
		code: code,
		name: name,
		units: units,
		category: categoryId,
		rate: rate,
		primaryUnit: primaryUnit,
		stocked: stocked,
		stock: initialStock,
		mrp: mrp,
		belongsTo: user
	});
	await productData.populate(["belongsTo", "category"]);
	return await productData.save();
}

/**
 * Update a Product within the category id
 * 
 * @param {string} id - Unique id of the existing Product
 * @param {string} code - Unique code of the Product
 * @param {string} name - Name of the Product
 * @param {number} rate - Rate of the Product
 * @param {number} mrp - MRP of the Product
 * @param {number} cost - Cost of the Product
 * @param {string="Unit"} primaryUnit - Primary Unit of the Product
 * @param {boolean} stocked - is the product being Stocked or not
 * @param {ProductCategory._id} categoryId 
 * @param {Unit[]=} units - Units array of the product
 * @returns 
 */
async function updateProduct(id, code, name, primaryUnit = "Unit", rate, mrp, cost = 0, stocked = false, categoryId, units, user) {
	if (units && units.length)
		units = unitSchemaValidation(
			rate,
			mrp,
			units,
			cost
		);
	else units = [];

	const productData = await Product.findOneAndUpdate({ _id: id }, {
		code: code,
		name: name,
		units: units,
		category: categoryId,
		rate: rate,
		primaryUnit: primaryUnit,
		stocked: stocked,
		cost: cost,
		mrp: mrp,
		belongsTo: user
	}, { new: true });
	await productData.populate(["belongsTo", "category"]);
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
	});

	return await newCategory.save();
}
exports.createCategory = createCategory;

/**
 * Insert multiple products within a Product Category
 * 
 * @param {NewProductData[]} newProductsArray - Array of New Products' data
 * @param {ProductCategory._id} categoryId - Product Category which those comes under
 */
async function addMultipleProducts(newProductsArray, categoryId, user) {
	for (let product of newProductsArray) {
		if (product.units && product.units.length)
			product.units = unitSchemaValidation(
				product.rate,
				product.mrp,
				product.units,
				product.cost
			);
		product.category = categoryId;
		product.belongsTo = user;
	}

	const session = await Product.startSession();
	const count = await Product.countDocuments();

	await session.withTransaction(async () => {
		await Product.create(newProductsArray, { session });
	});

	const newCount = await Product.countDocuments();

	session.endSession();

	return { count: newCount - count };
}

/**
 * Delete the Product category by deleting all the Products within that category.
 * @param {ProductCategory._id} _id 
 * @returns {{deletedProductsCount:number}}
 */
async function deleteProductCategoryAndProducts(_id) {
	const session = await mognoose.startSession();
	session.startTransaction();

	try {
		const deletedProducts = await Product.deleteMany({ category: _id }, { session });

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
		.matches(/^[a-z0-9./\- ]+$/i)
		.bail()
		.custom((value, { req }) => {
			return ProductCategory
				.findOne({ belongsTo: req.user._id, name: value }).then((res) => {
					if (res) return Promise.reject("This Product Category already present");
				});
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
				const newCategory = await createCategory(req.body.name, req.user._id, req.body.hasAccess || []);
				return apiResponse.successResponseWithData(res, "Product category created", { _id: newCategory._id.toString() });
			} else if (authenticatedUser.settings && authenticatedUser.settings.permissions.includes("ALLOW_PRODUCTCATEGORY_POST")) {
				const newCategory = await createCategory(req.body.name, authenticatedUser.belongsTo._id, req.body.hasAccess || [req.user._id]);
				return apiResponse.successResponseWithData(res, "Product category created", { _id: newCategory._id.toString() });
			} else {
				return apiResponse.unauthorizedResponse(res, "You are not authorised to perform this action");
			}
		} catch (e) {
			return apiResponse.ErrorResponse(res, e.message || e);
		}
	}
];

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
					);
				});
			} else {
				return apiResponse.unauthorizedResponse(res, "You are not authorised to perform this action");
			}
		} catch (e) {
			return apiResponse.ErrorResponse(res, e.message || e);
		}
	}
];

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
			const product = await getProductById(req.params.productId);

			if (product === null) {
				return apiResponse.notFoundResponse(
					res,
					"Product does not exist"
				);
			} else {
				if (hasAccessPermission(authenticatedUser, product, "ALLOW_PRODUCT_DELETE")) {
					return Product.findByIdAndRemove(req.params.productId).then(() =>
						apiResponse.successResponse(
							res,
							"Product deleted"
						)
					);
				} else {
					return apiResponse.unauthorizedResponse(res, "Not authorised for this action");
				}
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err.message);
		}
	}
];

/**
 * Create a Product.
 *
 * @param {string} name - Name of the product.
 * @param {string} code - Unique Code of the product.
 * @param {string} primaryUnit - Primary Unit Name of the product.
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
			ProductCategory.findById(value).then((doc) => {
				if (!doc) {
					return Promise.reject(
						"Product Category does not exists"
					);
				}
			})
		),
	body("code")
		.escape()
		.trim()
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
	body("name").escape().isLength().trim(),
	body("primaryUnit").escape().isLength().trim(),
	body("rate").escape().trim().isNumeric(),
	body("stocked").escape().trim().isBoolean().optional(),
	body("cost").escape().trim().isNumeric(),
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
				);
			const newProduct = await createProduct(
				req.body.code,
				req.body.name,
				req.body.primaryUnit,
				req.body.rate,
				req.body.mrp,
				req.body.cost,
				req.body.stocked,
				req.body.initialStock,
				req.params.categoryId,
				req.body.units,
				authenticatedUser.belongsTo ? authenticatedUser.belongsTo._id.toString() : authenticatedUser._id.toString()
			);
			return apiResponse.successResponseWithData(
				res,
				"Product Created",
				new ProductData(newProduct)
			);
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
			ProductCategory.findById(value).then((doc) => {
				if (!doc) {
					return Promise.reject(
						"Product Category does not exists"
					);
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
				);
			return deleteProductCategoryAndProducts(req.params.categoryId)
				.then(response => {
					return apiResponse.successResponseWithData(res, "Product Cateogory deleted", response);
				});
		} catch (e) {
			console.error(e);
			return apiResponse.ErrorResponse(
				res,
				"Product Deletion Error",
				e.message || e
			);
		}
	}
];

/**
 * Bulk Import Products.
 *
 */
exports.importProducts = [
	auth,
	param("categoryId", "Invalid category id")
		.escape().trim().isMongoId()
		.custom((value) =>
			ProductCategory.findById(value).then((doc) => {
				if (!doc) {
					return Promise.reject(
						"Product Category does not exists"
					);
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
				);
			}
			const { count } = await addMultipleProducts(req.body.items, req.params.categoryId, authenticatedUser.belongsTo ? authenticatedUser.belongsTo._id.toString() : authenticatedUser._id.toString());
			return apiResponse.successResponse(
				res,
				`Imported ${count} Products`
			);
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err.message || err);
		}
	},
];

/**
 * Bulk Export Products.
 *
 */
exports.exportProducts = [
	auth,
	param("categoryId", "Invalid category id")
		.escape().trim().isMongoId()
		.custom((value) =>
			ProductCategory.findById(value).then((doc) => {
				if (!doc) {
					return Promise.reject(
						"Product Category does not exists"
					);
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
				!hasAccessPermission(authenticatedUser, null, "ALLOW_PRODUCT_POST") ||
				!(await hasProductCategoryAccess(authenticatedUser, req.params.categoryId, "ALLOW_PRODUCTCATEGORY_GET"))
			) {
				return apiResponse.unauthorizedResponse(
					res,
					"You are not authorised for this operation"
				);
			}

			const itemsArrayToCsvArray = (items) => items.map(
				({ name,
					code,
					primaryUnit,
					rate,
					mrp,
					cost,
					units, }) =>
					[name,
						code,
						primaryUnit,
						rate,
						mrp,
						cost,
						...units.map(
							({ name, rate, mrp, cost, conversion }) => [name,
								rate,
								mrp,
								cost,
								conversion]).flat()
					]
			);

			return Product.find({ category: req.params.categoryId }).exec().then(
				(products) => {
					if (products.length === 0) {
						return apiResponse.notFoundResponse(res, "No Products Found");
					}
					products = itemsArrayToCsvArray(products);
					products.unshift([
						"Product Name",
						"Product Code",
						"Primary Unit",
						"Product Rate",
						"Product MRP",
						"Product Cost",
					]);

					const csv = Papa.unparse(products);
					res.set("Access-Control-Expose-Headers", "x-bills-export-filename");
					return apiResponse.successResponseWithFile(
						res.set("x-bills-export-filename", "category_" + req.params.categoryId + ".csv"),
						"category_" + req.params.categoryId + ".csv",
						csv
					);
				},
				(err) => apiResponse.ErrorResponse(res, err)
			);
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
	param("categoryId", "Invalid category id")
		.escape().trim().isMongoId()
		.custom((value) =>
			ProductCategory.findById(value).then((doc) => {
				if (!doc) {
					return Promise.reject(
						"Product Category does not exists"
					);
				}
			})
		),
	param("productId", "Invalid Product id")
		.escape().trim().isMongoId()
		.custom((value) =>
			Product.findById(value).then((doc) => {
				if (!doc) {
					return Promise.reject(
						"Product does not exists"
					);
				}
			})
		),
	body("code")
		.escape()
		.trim()
		.custom((value, { req }) =>
			Product.findOne({
				code: value,
				category: req.params.categoryId,
			}).then((doc) => {
				if (doc && doc._id.toString() !== req.params.productId)
					return Promise.reject(
						"Item with this code already exists."
					);
			})
		),
	body("name").escape().isLength().trim(),
	body("primaryUnit").escape().isLength().trim(),
	body("rate").escape().trim().isNumeric(),
	body("stocked").escape().trim().isBoolean(),
	body("cost").escape().trim().isNumeric(),
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
				);
			const newProduct = await updateProduct(
				req.params.productId,
				req.body.code,
				req.body.name,
				req.body.primaryUnit,
				req.body.rate,
				req.body.mrp,
				req.body.cost,
				req.body.stocked,
				req.params.categoryId,
				req.body.units,
				authenticatedUser.belongsTo ? authenticatedUser.belongsTo._id.toString() : authenticatedUser._id.toString()
			);
			return apiResponse.successResponseWithData(
				res,
				"Product Updated",
				new ProductData(newProduct)
			);
		} catch (e) {
			return apiResponse.validationErrorWithData(
				res,
				"Product Updation Error",
				e.message || e
			);
		}
	}
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
	body("name").optional().escape().trim().matches(/^[a-z0-9./\- ]+$/i),
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
				return apiResponse.unauthorizedResponse(res, "You are not authorised for this operation");

			const productCategory = await ProductCategory.findById(req.params.categoryId);
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
				);
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
	param("code").escape().trim(),
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
				);

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
				);
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
				return apiResponse.unauthorizedResponse(res, "You are not authorised to do this operation");

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
	param("code").escape().trim(),
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
				return apiResponse.unauthorizedResponse(res, "You are not authorised to do this operation");

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
				return apiResponse.unauthorizedResponse(res, "You are not authorised to do this operation");

			return getProductByIdAndCategory(req.params.productId, req.params.categoryId).then((product) => {
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
						);
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
