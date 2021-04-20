var express = require("express");
var router = express.Router();
const path = require("path");

/* GET Login Page */
router.get("/", function (req, res, next) {
	res.cookie("redirectToken", req.headers.referer, {
		httpOnly: true,
		sameSite: "none",
		secure: true
	});
	return next();
}, express.static(path.join(__dirname, "../public")));
router.all("/*", [
	function (req, res, next) {
		return next('router');
	}
])

module.exports = router;
