var express = require("express");
const { login, userRegistration, deleteUserAccount, updateAccountDetails, fetchUserData, logout, numberAvailability, salesmenList, updateUserDetails } = require("../controllers/AuthController");

var router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", userRegistration);
router.get("/register/:phone/availability", numberAvailability);

router.get("/", fetchUserData);
router.get("/salesmen", salesmenList);

router.put("/:userId.:param", updateUserDetails);
router.put("/:id", updateAccountDetails);
router.delete("/:id", deleteUserAccount)
module.exports = router;
