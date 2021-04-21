const express = require("express");
var app = express();
var loginRouter = require("../routes/login");
var apiRouter = require("../routes/api");
var apiResponse = require("../helpers/apiResponse");

/* GET home page. */
app.use("/login", loginRouter);
app.use("/api", apiRouter);
app.use("/api", function (err, req, res, next) {
	if (err.name === "UnauthorizedError") {
		return apiResponse.unauthorizedResponse(res, err.message);
	} else next(err);
});
app.use("/*", function (req, res) {
	return apiResponse.notFoundResponse(res, "Page not found");
});

module.exports = app;
