var express = require("express");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
var indexRouter = require("./routes/index");
var apiResponse = require("./helpers/apiResponse");
var cors = require("cors");


const APP_LOG = "[ APP ] ";

// DB connection
var MONGODB_URL = process.env.MONGODB_URL;
var mongoose = require("mongoose");

// Overcome collection.ensureIndex deprecation warning.
// mongoose.set("useNewUrlParser", true);
// mongoose.set("useFindAndModify", false);
// mongoose.set("useCreateIndex", true);


var app = express();

//don't show the log when it is test
if (process.env.NODE_ENV !== "test") {
	app.use(logger("dev"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//To allow all cross-origin requests
app.use(cors({
	origin: true,
	optionsSuccessStatus: 200,
	credentials: true,
})
);

mongoose
	.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		//don't show the log when it is test
		if (process.env.NODE_ENV !== "test") {
			console.log(APP_LOG + "MONGODB AT: %s", MONGODB_URL);
			console.log(APP_LOG + "STATUS: RUNNING\n");
		}
	})
	.catch((err) => {
		console.log(APP_LOG + "STATUS: STARTING ERROR\n");
		console.error(APP_LOG + "ERROR: ", err.message);
		process.exit(1);
	});

//Route Prefixes
app.use("/", indexRouter);

// app.use((err, req, res) => {
// 	if (err.name === "UnauthorizedError") {
// 		return apiResponse.unauthorizedResponse(res, err.message);
// 	}
// });

app.use(function (err, req, res) {
	return apiResponse.ErrorResponse(res, err);
});


module.exports = app;
