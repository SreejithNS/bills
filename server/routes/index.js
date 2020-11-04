var express = require("express");
var router = express.Router();
const path = require("path");
const auth = require("../middlewares/jwt");

/* GET home page. */
router.all(
	"/",
	auth,
	function (req, res, next) {
		console.log(path.join(__dirname, "../client/build"));
		if (req.user) {
			next();
		} else {
			res.redirect("/login");
		}
	},
	express.static(path.join(__dirname, "../client/build"))
);

module.exports = router;
