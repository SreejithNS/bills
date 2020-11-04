var express = require("express");
var router = express.Router();
const path = require("path");
const auth = require("../middlewares/jwt");

/* GET home page. */
//router.use("/");

module.exports = [
	auth,
	function (err, req, res, next) {
		if (err.name === "UnauthorizedError") {
			debugger;
			res.redirect("/login");
		} else {
			next(err);
		}
	},
	express.static(path.join(__dirname, "../../client/build")),
];
