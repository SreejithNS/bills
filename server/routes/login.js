var express = require("express");
var router = express.Router();
const path = require("path");
const auth = require("../middlewares/jwt");

/* GET Login Page */

module.exports = [
	auth,
	function (err, req, res, next) {
		if (err.name === "UnauthorizedError") {
			next();
		} else if (res.user) {
			res.redirect("/");
		}
	},
	express.static(path.join(__dirname, "../public")),
];
