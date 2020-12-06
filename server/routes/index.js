const auth = require("../middlewares/jwt");

/* GET home page. */
//router.use("/");

module.exports = [
	auth,
	function (err, req, res, next) {
		if (err.name === "UnauthorizedError") {
			res.redirect("/login");
		} else {
			next(err);
		}
	},
	function (req, res) {
		res.redirect("https://bills.sreejithofficial.in/");
	},
];
