var express = require("express");
const AuthController = require("../controllers/AuthController");

var router = express.Router();

router.get("/", AuthController.userData);
router.get("/salesmen", AuthController.salesmenList);
router.post("/register", AuthController.register);
router.post("/registerSalesman", AuthController.registerSalesman);
router.put("/salesmanPassword", AuthController.updateSalesmanPassword);
router.get(
	"/salesman/numberAvailability/:phone",
	AuthController.numberAvailability
);
router.post("/login", AuthController.login);
router.post("/verify-otp", AuthController.verifyConfirm);
router.post("/resend-verify-otp", AuthController.resendConfirmOtp);
router.post("/logout", AuthController.logout);

module.exports = router;
