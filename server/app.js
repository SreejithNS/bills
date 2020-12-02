var express = require("express");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
var indexRouter = require("./routes/index");
var loginRouter = require("./routes/login");
var apiRouter = require("./routes/api");
var apiResponse = require("./helpers/apiResponse");
var cors = require("cors");

// DB connection
var MONGODB_URL = process.env.MONGODB_URL;
var mongoose = require("mongoose");
mongoose
	.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		//don't show the log when it is test
		if (process.env.NODE_ENV !== "test") {
			console.log("Connected to %s", MONGODB_URL);
			console.log("App is running ... \n");
			console.log("Press CTRL + C to stop the process. \n");
		}
	})
	.catch((err) => {
		console.error("App starting error:", err.message);
		process.exit(1);
	});
var db = mongoose.connection;

var app = express();

//don't show the log when it is test
if (process.env.NODE_ENV !== "test") {
	app.use(logger("dev"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "../client/build")));
// app.use(express.static(path.join(__dirname, "./public")));

//To allow cross-origin requests
app.use(
	cors({
		origin: "http://localhost:3000",
		optionsSuccessStatus: 200,
		credentials: true,
	})
);

//Route Prefixes

app.use("/api", apiRouter);
app.use("/api", function (err, req, res, next) {
	if (err.name === "UnauthorizedError") {
		apiResponse.unauthorizedResponse(res, err.message);
	} else next(err);
});
app.use("/login", loginRouter);
app.use("/", indexRouter);
app.use("/*", indexRouter);
// throw 404 if URL not found
app.all("*", function (req, res) {
	return apiResponse.notFoundResponse(res, "Page not found");
});

// app.use((err, req, res) => {
// 	if (err.name === "UnauthorizedError") {
// 		return apiResponse.unauthorizedResponse(res, err.message);
// 	}
// });

app.use(function (err, req, res, next) {
	if (err.name === "UnauthorizedError") {
		apiResponse.unauthorizedResponse(res, err.message);
	} else next(err);
});

module.exports = app;
