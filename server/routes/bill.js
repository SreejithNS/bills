var express = require("express");
const BillController = require("../controllers/BillController");

var router = express.Router();

router.post("/", BillController.saveBill);
router.get("/",BillController.getAllBills);

module.exports = router;