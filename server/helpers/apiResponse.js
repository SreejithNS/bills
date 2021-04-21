const e = require("express");
/**
 * 
 * @param {e.Response} res 
 * @param {string} msg 
 */

/**
 * @typedef ResponseData
 * @type {object}
 * @param {number} status - Success Status of the Response
 * @param {string} message - Response Message
 * @param {*=} data - Response Data if any
 */
exports.successResponse = function (res, msg) {
	/**
	 * @type {ResponseData}
	 */
	var data = {
		status: 1,
		message: msg
	};
	return res.status(200).json(data);
};
/**
 * 
 * @param {e.Response} res 
 * @param {string} msg 
 * @param {*} data 
 */
exports.successResponseWithData = function (res, msg, data) {
	/**
	 * @type {ResponseData}
	 */
	var resData = {
		status: 1,
		message: msg,
		data: data
	};
	return res.status(200).json(resData);
};
/**
 * 
 * @param {e.Response} res 
 * @param {string} msg 
 */
exports.ErrorResponse = function (res, msg) {
	/**
	 * @type {ResponseData}
	 */
	var data = {
		status: 0,
		message: msg,
	};
	return res.status(500).json(data);
};
/**
 * 
 * @param {e.Response} res 
 * @param {string} msg 
 */
exports.notFoundResponse = function (res, msg) {
	/**
	 * @type {ResponseData}
	 */
	var data = {
		status: 0,
		message: msg,
	};
	return res.status(404).json(data);
};

/**
 * 
 * @param {e.Response} res 
 * @param {string} msg 
 * @param {*} data 
 */
exports.validationErrorWithData = function (res, msg, data) {
	/**
	 * @type {ResponseData}
	 */
	var resData = {
		status: 0,
		message: msg,
		data: data
	};
	return res.status(400).json(resData);
};

/**
 * 
 * @param {e.Response} res 
 * @param {string} msg 
 */
exports.unauthorizedResponse = function (res, msg) {
	/**
	 * @type {ResponseData}
	 */
	var data = {
		status: 0,
		message: msg,
	};
	return res.status(401).json(data);
};