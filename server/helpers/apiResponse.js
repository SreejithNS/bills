/**
 * 
 * @param {*} res 
 * @param {*} msg 
 */
exports.successResponse = function (res, msg) {
	var data = {
		status: 1,
		message: msg
	};
	return res.status(200).json(data);
};
/**
 * 
 * @param {*} res 
 * @param {*} msg 
 * @param {*} data 
 */
exports.successResponseWithData = function (res, msg, data) {
	var resData = {
		status: 1,
		message: msg,
		data: data
	};
	return res.status(200).json(resData);
};
/**
 * 
 * @param {*} res 
 * @param {*} msg 
 */
exports.ErrorResponse = function (res, msg) {
	var data = {
		status: 0,
		message: msg,
	};
	return res.status(500).json(data);
};
/**
 * 
 * @param {*} res 
 * @param {*} msg 
 */
exports.notFoundResponse = function (res, msg) {
	var data = {
		status: 0,
		message: msg,
	};
	return res.status(404).json(data);
};

/**
 * 
 * @param {*} res 
 * @param {*} msg 
 * @param {*} data 
 */
exports.validationErrorWithData = function (res, msg, data) {
	var resData = {
		status: 0,
		message: msg,
		data: data
	};
	return res.status(400).json(resData);
};

/**
 * 
 * @param {*} res 
 * @param {*} msg 
 */
exports.unauthorizedResponse = function (res, msg) {
	var data = {
		status: 0,
		message: msg,
	};
	return res.status(401).json(data);
};