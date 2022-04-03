const express = require("express");
var app = express();
var loginRouter = require("../routes/login");
var apiRouter = require("../routes/api");
var apiResponse = require("../helpers/apiResponse");
const path = require("path");

const forest = require("forest-express-mongoose");
var mongoose = require("mongoose");

app.get("/check", function (req, res) {
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
	// app.use("/static", express.static(path.resolve(__dirname, "../../client", "build", "static")));
	app.use("/", express.static(path.resolve(__dirname, "../../client", "build")));
	// app.use("/**/*", function (req, res) {
	// 	res.sendFile("index.html", path.join(__dirname, "../../client/build/"));
	// });
	app.get("/*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "../../client", "build", "index.html"));
	});
	// app.use("/*", express.static(path.resolve(__dirname, "../../client", "build")));


	// app.use("/*", function (req, res) {
	// 	return apiResponse.notFoundResponse(res, "Page not found");
	// });
});


// /* GET home page. */
// // app.all("/", function (req, res) {
// // 	return apiResponse.successResponse(res, "Bills Server is up and running smoothly");
// // });
// app.get("/*", (req, res) => {
// 	res.sendFile(path.resolve(__dirname, "../../client", "build", "index.html"));
// });

module.exports = app;
