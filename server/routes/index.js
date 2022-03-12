const express = require("express");
var app = express();
var loginRouter = require("../routes/login");
var apiRouter = require("../routes/api");
var apiResponse = require("../helpers/apiResponse");

const forest = require("forest-express-mongoose");
var mongoose = require("mongoose");

/* GET home page. */
app.all("/", function (req, res) {
	return apiResponse.successResponse(res, "Bills Server is up and running smoothly");
});
app.all("/check", function (req, res) {
	return apiResponse.successResponse(res, "Bills Server is up and running smoothly");
});
app.use("/login", loginRouter);
app.use("/api", apiRouter);
app.use("/api", function (err, req, res, next) {
	if (err.name === "UnauthorizedError") {
		return apiResponse.unauthorizedResponse(res, err.message);
	} else next(err);
});

// Forest Admin
forest.init({
	envSecret: process.env.FOREST_ENV_SECRET,
	authSecret: process.env.FOREST_AUTH_SECRET,
	objectMapping: mongoose,
	connections: { default: mongoose.connection },
}).then((FAMiddleware) => {
	app.use(FAMiddleware);

	app.use("/*", function (req, res) {
		return apiResponse.notFoundResponse(res, "Page not found");
	});
});

module.exports = app;
