var express = require("express");
const BillController = require("../controllers/BillController");

var router = express.Router();

router.post("/", BillController.saveBill);
router.get("/", BillController.getAllBills);
router.get("/:id", BillController.getBill);
router.get("/analysis/itemsTransaction", BillController.itemsAndQuantities);
router.get("/analysis/customerPurchases", BillController.customerAndPurchases);

module.exports = router;
