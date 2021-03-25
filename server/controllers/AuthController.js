const { User } = require("../models/UserModel");
const { body, validationResult, param, query } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authenticate = require("../middlewares/jwt");
const { privilegeEnum, defaultSalesmanPermissions } = require("../helpers/privilegeEnum");
const { UserSettings } = require("../models/UserSettingsModel");

// Types
/**
 * @typedef Permissions
 * @type {object}
 * @property {privilegeEnum} type - Type Number of User.
 * @property {[string]} permissions - List of permissions of User.
 * @property {User._id=} belongsTo - Admin User Id if this user is not admin.
 */

// Functions 

/**
 * Abstract User Data from User Document
 * @param {object} params 
 */
function UserData(params) {
	this._id = params._id.toString();
	this.name = params.name;
	this.phone = params.phone;
	this.type = params.type;
	this.settings = params.settings;
	this.belongsTo = params.belongsTo && new UserData(params.belongsTo);
}

/**
 * Create User Account with Password Encryption.
 * 
 * @param {string} name - User Name
 * @param {number} phone - User Phone Number
 * @param {string} password - User Account Password
 * @param {Permissions=} permissions - Permissions and Account type Details if any.
 * @returns {User}
 */
async function createUser(name, phone, password, permissions) {
	const hashedPassword = await (new Promise((res, rej) => {
		bcrypt.hash(password, 10, function (err, hash) {
			if (err) rej(err);
			res(hash);
		})
	}));

	const newUserData = {
		name,
		phone,
		password: hashedPassword,
		type: permissions ? permissions.type : privilegeEnum.admin,
		...((permissions && permissions.type === privilegeEnum.salesman) && { belongsTo: permissions.belongsTo })
	};

	// Create a UserSettings for the permissions given.
	if (permissions) {
		const settings = new UserSettings({ permissions: permissions.permissions });
		await settings.save();
		newUserData.settings = settings._id;
	}

	var newUser = new User(newUserData);

	return await newUser.save();
}

async function createCategory(name, belongsTo, hasAccess) {
	const newCategory = new ProductCategory({
		name, belongsTo, hasAccess
	})

	return await newCategory.save()
}

/**
 * Authenticate the user with phone number and password;
 * 
 * @param {number} phone - User Phone
 * @param {string} password - User Account Password
 * @returns {{_id:string;token:string}}
 */
async function userAuthentication(phone, password) {
	const user = await User.findOne({ phone }).populate("settings").exec();
	if (user) {
		return await bcrypt.compare(
			password,
			user.password
		).then(
			(same) => {
				if (same) {
					// Check User's account active or not.
					if (user.status) {
						//Prepare JWT token for authentication
						const jwtPayload = { _id: user._id.toString() }
						const jwtData = {
							expiresIn:
								process.env
									.JWT_TIMEOUT_DURATION,
						};
						const secret =
							process.env.JWT_SECRET;

						//Generated JWT token with Payload and secret.
						const token = jwt.sign(
							jwtPayload,
							secret,
							jwtData
						);

						return { ...jwtPayload, token };

					} else {
						throw new Error("Account is not active. Please contact admin.");
					}
				} else {
					throw new Error("Phone or Password wrong");
				}
			}
		);
	} else {
		throw new Error("User not found");
	}
}

/**
 * Get User Data
 * @param {User._id} _id - User Account _id
 * @returns {UserData}
 */
async function userData(_id) {
	const user = await User.findById(_id).populate("belongsTo").populate("settings").exec();
	if (user) {
		return new UserData(user);
	} else {
		return new Error("Authentication Details Tampered")
	}
	// , async (err, res) => {
	// if (err) return new Error(err);
	// if (res) {
	// 	await res.populate("belongsTo");
	// 	await res.populate("settings");

	return new UserData(res);
	// 	} else {
	// 		return new Error("Authentication Details Tampered")
	// 	}
	// })
}

async function userAccountDetailsUpdate(userId, param, value) {
	switch (param) {
		case "password":
			param = await new Promise((resolve, reject) => {
				bcrypt.hash(param, 10, async (err, hash) => {
					if (err) reject(err)
					resolve(hash)
				});
			})
			break;
		case "settings":
			throw new Error("You cannot update Settings explicitly");
		default:
			break;
	}
	let updatedAccountDetails = await User.findByIdAndUpdate(userId, { [param]: value }, { new: true });
	if (updatedAccountDetails[param] === value) {
		return new UserData(updatedAccountDetails);
	} else {
		throw new Error("User Details Update did not apply");
	}
}

// Middlewares

async function adminRegistrationMiddleware(req, res) {
	try {
		// Extract the validation errors from a request.
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// Display sanitized values/errors messages.
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error.",
				errors.array()
			);
		} else {
			const newUser = await createUser(req.body.name, req.body.phone, req.body.password);
			await createCategory("General", newUser._id.toString(), []);

			return apiResponse.successResponseWithData(
				res,
				"Registration Success",
				newUser._id
			);
		}
	} catch (err) {
		//throw error in json response with status 500.
		return apiResponse.ErrorResponse(res, err.message);
	}
}

async function salesmanRegisterMiddleware(req, res) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return apiResponse.validationErrorWithData(
				res,
				"Validation Error.",
				errors.array()
			);
		} else {
			/**
			 * @type {Permissions}
			 */
			const permissions = {
				type: privilegeEnum.salesman,
				permissions: req.body.permissions || defaultSalesmanPermissions,
				belongsTo: req.user._id
			}

			const newUser = await createUser(req.body.name, req.body.phone, req.body.password, permissions);

			return apiResponse.successResponseWithData(
				res,
				"Registration Success",
				newUser._id
			);
		}
	} catch (err) {
		//throw error in json response with status 500.
		return apiResponse.ErrorResponse(res, err.message);
	}
}

/**
 * User registration.
 *
 * @param {string} name - User Name
 * @param {number} phone - User Phone number
 * @param {string} password - User Password
 *
 * @returns {Object}
 */

const userRegistration = [
	authenticate,
	query("type", "Not a valid user type").optional().isInt(),
	body("name")
		.trim()
		.isLength({ min: 1 })
		.withMessage("Name must be specified.")
		.matches(/^[a-z0-9 ]+$/i)
		.withMessage("Name must contain only alphanumeric and spaces"),
	body("phone")
		.trim()
		.isLength({ min: 10, max: 10 })
		.isNumeric()
		.withMessage("Phone must be 10 digits.")
		.custom((value) => {
			return User.findOne({ phone: value }).then(
				(user) => {
					if (user) {
						return Promise.reject("Phone Number already taken");
					}
				}
			);
		}),
	body("password")
		.isLength({ min: 6 })
		.trim()
		.withMessage("Password must be 6 characters or greater."),
	async (req, res) => {
		const authenticatedUser = await userData(req.user._id);
		if (authenticatedUser.type === privilegeEnum.admin) {
			return await salesmanRegisterMiddleware(req, res);
		} else if (authenticatedUser.type === privilegeEnum.root) {
			if (req.params.type !== undefined) {
				switch (req.params.type) {
					case 0:
					case 1:
						return await adminRegistrationMiddleware(req, res);
					case 2:
					default:
						return await salesmanRegisterMiddleware(req, res);
				}
			} else {
				return await salesmanRegisterMiddleware(req, res);
			}
		}
	}
];

/**
 * User login.
 *
 * @param {string} phone
 * @param {string} password
 *
 * @returns {Object}
 */

const login = [
	body("phone")
		.trim()
		.isLength({ min: 10, max: 10 })
		.isNumeric()
		.withMessage("Phone must be 10 digits.")
		.custom((value) => {
			return User.findOne({ phone: value }).then(
				(user) => {
					if (!user) {
						return Promise.reject("Phone Number does not exist");
					}
				}
			);
		}),
	body("password")
		.isLength({ min: 6 })
		.trim()
		.withMessage("Password must be 6 characters or greater."),
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(
					res,
					"Validation Error.",
					errors.array()
				);
			} else {
				try {
					const authenticationData = await userAuthentication(req.body.phone, req.body.password);
					res.cookie("auth-token", authenticationData.token, {
						httpOnly: true,
						sameSite: "none",
						secure: true,
					});
					return apiResponse.successResponseWithData(res, "User Authenticated", authenticationData);
				} catch (e) {
					return apiResponse.unauthorizedResponse(res, "Authentication Failed", e);
				}
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

const fetchUserData = [
	authenticate,
	async (req, res) => {
		try {
			const authenticatedUserData = await userData(req.user._id);
			return apiResponse.successResponseWithData(
				res,
				"User Data fetched",
				new UserData(authenticatedUserData)
			);
		} catch (e) {
			return apiResponse.ErrorResponse(
				res,
				e.message || e
			);
		}
	},
];

const logout = (req, res) => {
	res.cookie("token", { httpOnly: true, expires: Date.now() });
	return apiResponse.successResponse(res, "Successfully logged out");
}

const numberAvailability = [
	authenticate,
	(req, res) => {
		if (req.user.type !== privilegeEnum.admin)
			return apiResponse.unauthorizedResponse(
				res,
				"You are not authorised to check number availability"
			);
		User.find({ phone: req.params.phone }, (err, docs) => {
			if (err)
				return apiResponse.ErrorResponse(
					res,
					"Error in checking number availability"
				);
			return apiResponse.successResponseWithData(
				res,
				"Number availability",
				!(docs && docs.length)
			);
		});
	},
];

const salesmenList = [
	authenticate,
	async (req, res) => {
		try {
			const authenticatedUserData = await userData(req.user._id);
			if (
				authenticatedUserData.type === privilegeEnum.root ||
				authenticatedUserData.type === privilegeEnum.admin ||
				(authenticatedUserData.settings && authenticatedUserData.settings.permissions.includes("ALLOW_USER_GET"))
			) {
				return User.find({ belongsTo: req.user._id }).populate("settings").populate("belongsTo").exec((err, docs) => {
					if (err)
						return apiResponse.ErrorResponse(
							res,
							"Cannot retreive the Salesmen list"
						);
					return apiResponse.successResponseWithData(
						res,
						"Salesmaen list",
						docs.map((salesman) => new UserData(salesman))
					);
				});
			} else return apiResponse.unauthorizedResponse(
				res,
				"You are not authorised to retreive salesmen list."
			);
		} catch (e) {
			return apiResponse.ErrorResponse(res, e.message || e);
		}
	}
];

const updateUserDetails = [
	authenticate,
	param("userId").escape().trim().isMongoId(),
	async (req, res) => {
		try {
			const authenticatedUser = await userData(req.user._id);
			const paramUser = await userData(req.params.userId);
			const param = req.params.param;
			const value = req.params.value;
			if (
				( // Self account updation with permission or being an admin
					authenticatedUser._id === paramUser._id &&
					(
						(authenticatedUser.settings && authenticatedUser.settings.permissions.includes("ALLOW_USER_PUT_SELF")) ||
						authenticatedUser.type === privilegeEnum.admin
					)
				) || ( // Account belonging to the admin or someone with permissions to update who belongs to the same admin
					(paramUser.belongsTo._id === authenticatedUser._id && authenticatedUser.type === privilegeEnum.admin) ||
					(paramUser.belongsTo._id === authenticatedUser.belongsTo._id &&
						(authenticatedUser.settings && authenticatedUser.settings.permissions.includes("ALLOW_USER_PUT"))
					)
				) || (
					authenticatedUser._id === paramUser._id && authenticated
				)
			) {
				const updatedDetails = await userAccountDetailsUpdate(req.params.userId, param, value);
				return apiResponse.successResponseWithData(res, "User Details Updated", updatedDetails);
			} else return apiResponse.unauthorizedResponse(res, "You are not authorised for this operation")
		} catch (e) {
			return apiResponse.ErrorResponse(res, e.message || e);
		}
	}
];

module.exports = {
	UserData,
	userData,
	userRegistration,
	login,
	fetchUserData,
	logout,
	numberAvailability,
	salesmenList,
	updateUserDetails
}