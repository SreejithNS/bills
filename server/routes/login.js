var express = require("express");
var router = express.Router();
const path = require("path");
const auth = require("../middlewares/jwt");

/* GET Login Page */
router.all(
	"/login",
	function (req, res, next) {
		console.log("Login:", path.join(__dirname, "../public"));
		if (req.user) {
			next();
		} else {
			res.redirect("/");
		}
	},
	express.static(path.join(__dirname, "../public"))
);

module.exports = router;
