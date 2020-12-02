const UserModel = require("../models/UserModel");
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const _ = require("lodash");
const authenticate = require("../middlewares/jwt");

function UserData(params) {
	this._id = params.id;
	this.firstName = params.firstName;
	this.lastName = params.lastName;
	this.email = params.email;
	this.phone = params.phone;
	this.type = params.type;
	this.settings = params.settings || { restrictedRoutes: [] };
	this.worksUnder = params.worksUnder;
}

/**
 * User registration.
 *
 * @param {string}      firstName
 * @param {string=}      lastName
 * @param {string=}      email
 * @param {number}		phone
 * @param {string}      password
 *
 * @returns {Object}
 */
function register(req, res) {
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
			//hash input password
			bcrypt.hash(req.body.password, 10, function (err, hash) {
				// generate OTP for confirmation
				//let otp = utility.randomNumber(4);
				// Create User object with escaped and trimmed data
				const undefinedOmitter = {
					firstName: req.body.firstName,
					lastName: req.body.lastName,
					email: req.body.email,
					phone: parseInt(req.body.phone),
					password: hash,
					//confirmOTP: otp
				};

				var user = new UserModel(undefinedOmitter);

				// Html email body
				//let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
				// Send confirmation email
				/*mailer.send(
					constants.confirmEmails.from, 
					req.body.email,
					"Confirm Account",
					html
				).then(function(){*/
				// Save user.
				user.save(function (err) {
					if (err) {
						return apiResponse.ErrorResponse(res, err);
					}
					let userData = new UserData(user);
					return apiResponse.successResponseWithData(
						res,
						"Registration Success.",
						userData
					);
				});
				/*}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res,err);
				}) ;*/
			});
		}
	} catch (err) {
		//throw error in json response with status 500.
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.register = [
	// Validate fields.
	body("firstName")
		.isLength({ min: 1 })
		.trim()
		.withMessage("First name must be specified.")
		.isAlphanumeric()
		.withMessage("First name has non-alphanumeric characters."),
	body("lastName")
		.trim()
		.optional()
		.isAlphanumeric()
		.withMessage("Last name has non-alphanumeric characters."),
	body("phone")
		.isLength({ min: 10, max: 10 })
		.trim()
		.withMessage("Phone must be 10 digits.")
		.custom((value) => {
			return UserModel.findOne({ phone: parseInt(value) }).then(
				(user) => {
					if (user) {
						return Promise.reject("Phone already in use");
					}
				}
			);
		}),
	body("email")
		.trim()
		.optional()
		.isEmail()
		.withMessage("Email must be a valid email address.")
		.custom((value) => {
			return UserModel.findOne({ email: value }).then((user) => {
				if (user) {
					return Promise.reject("E-mail already in use");
				}
			});
		}),
	body("password")
		.isLength({ min: 6 })
		.trim()
		.withMessage("Password must be 6 characters or greater."),
	// Sanitize fields.
	sanitizeBody("firstName").escape(),
	sanitizeBody("lastName").escape(),
	sanitizeBody("phone").escape(),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	// Process request after validation and sanitization.
	register,
];

/**
 * User login.
 *
 * @param {string}      phone
 * @param {string}      password
 *
 * @returns {Object}
 */

exports.login = [
	body("phone")
		.trim()
		.isNumeric()
		.withMessage("Valid Phone Number must be specified."),
	body("password")
		.isLength({ min: 1 })
		.trim()
		.withMessage("Password must be specified."),
	sanitizeBody("phone").escape(),
	sanitizeBody("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(
					res,
					"Validation Error.",
					errors.array()
				);
			} else {
				UserModel.findOne({ phone: parseInt(req.body.phone) }).then(
					(user) => {
						if (user) {
							//Compare given password with db's hash.
							bcrypt.compare(
								req.body.password,
								user.password,
								function (err, same) {
									if (same) {
										//Check account confirmation.
										if (user.isConfirmed) {
											// Check User's account active or not.
											if (user.status) {
												let userData = new UserData(
													user
												);

												//Prepare JWT token for authentication
												const jwtPayload = _.pick(
													userData,
													[
														"_id",
														"phone",
														"type",
														"firstName",
														"worksUnder",
														"settings",
													]
												);
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
												res.cookie("token", token, {
													httpOnly: true,
												});
												userData.token = token;
												return apiResponse.successResponseWithData(
													res,
													"Login Success.",
													userData
												);
											} else {
												return apiResponse.unauthorizedResponse(
													res,
													"Account is not active. Please contact admin."
												);
											}
										} else {
											return apiResponse.unauthorizedResponse(
												res,
												"Account is not confirmed. Please confirm your account."
											);
										}
									} else {
										return apiResponse.unauthorizedResponse(
											res,
											"Phone or Password wrong."
										);
									}
								}
							);
						} else {
							return apiResponse.unauthorizedResponse(
								res,
								"User not found"
							);
						}
					}
				);
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

exports.userData = [
	authenticate,
	(req, res) => {
		res.send(_.omit(req.user, ["exp", "iat"]));
	},
];

/**
 * Verify Confirm otp.
 *
 * @param {string}      email
 * @param {string}      otp
 *
 * @returns {Object}
 */
exports.verifyConfirm = [
	body("email")
		.isLength({ min: 1 })
		.trim()
		.withMessage("Email must be specified.")
		.isEmail()
		.withMessage("Email must be a valid email address."),
	body("otp")
		.isLength({ min: 1 })
		.trim()
		.withMessage("OTP must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("otp").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(
					res,
					"Validation Error.",
					errors.array()
				);
			} else {
				var query = { email: req.body.email };
				UserModel.findOne(query).then((user) => {
					if (user) {
						//Check already confirm or not.
						if (!user.isConfirmed) {
							//Check account confirmation.
							if (user.confirmOTP == req.body.otp) {
								//Update user as confirmed
								UserModel.findOneAndUpdate(query, {
									isConfirmed: 1,
									confirmOTP: null,
								}).catch((err) => {
									return apiResponse.ErrorResponse(res, err);
								});
								return apiResponse.successResponse(
									res,
									"Account confirmed success."
								);
							} else {
								return apiResponse.unauthorizedResponse(
									res,
									"Otp does not match"
								);
							}
						} else {
							return apiResponse.unauthorizedResponse(
								res,
								"Account already confirmed."
							);
						}
					} else {
						return apiResponse.unauthorizedResponse(
							res,
							"Specified email not found."
						);
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

/**
 * Resend Confirm otp.
 *
 * @param {string}      email
 *
 * @returns {Object}
 */
exports.resendConfirmOtp = [
	body("email")
		.isLength({ min: 1 })
		.trim()
		.withMessage("Email must be specified.")
		.isEmail()
		.withMessage("Email must be a valid email address."),
	sanitizeBody("email").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(
					res,
					"Validation Error.",
					errors.array()
				);
			} else {
				var query = { email: req.body.email };
				UserModel.findOne(query).then((user) => {
					if (user) {
						//Check already confirm or not.
						if (!user.isConfirmed) {
							// Generate otp
							let otp = utility.randomNumber(4);
							// Html email body
							let html =
								"<p>Please Confirm your Account.</p><p>OTP: " +
								otp +
								"</p>";
							// Send confirmation email
							mailer
								.send(
									constants.confirmEmails.from,
									req.body.email,
									"Confirm Account",
									html
								)
								.then(function () {
									user.isConfirmed = 0;
									user.confirmOTP = otp;
									// Save user.
									user.save(function (err) {
										if (err) {
											return apiResponse.ErrorResponse(
												res,
												err
											);
										}
										return apiResponse.successResponse(
											res,
											"Confirm otp sent."
										);
									});
								});
						} else {
							return apiResponse.unauthorizedResponse(
								res,
								"Account already confirmed."
							);
						}
					} else {
						return apiResponse.unauthorizedResponse(
							res,
							"Specified email not found."
						);
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	},
];

exports.logout = [
	authenticate,
	(req, res) => {
		res.cookie("token", { httpOnly: true, expires: Date.now() });
		return apiResponse.successResponse(res, "Successfully logged out");
	},
];
