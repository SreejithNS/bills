var express = require("express");
const CustomerController = require("../controllers/CustomerController");

var router = express.Router();

router.get("/:id", CustomerController.get);
router.get("/", CustomerController.getAll);
router.post("/", CustomerController.create);
router.delete("/:id", CustomerController.delete);

module.exports = router;