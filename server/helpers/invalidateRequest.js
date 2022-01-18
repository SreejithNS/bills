const { validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");

exports.validationResponse = function (req, res, next) {
    const validationError = validationResult(req);
    if (!validationError.isEmpty())
        return apiResponse.validationErrorWithData(
            res,
            "Validation Error",
            validationError.array()
        );
    else next();
};