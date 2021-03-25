var express = require("express");
const { getAllBills, getBill, receivePayment, saveBill, toggleBillCredit } = require("../controllers/BillController");

var router = express.Router();

router.post("/", saveBill);
router.get("/", getAllBills);
router.get("/id/:billId", getBill);

router.post("/:billId/payment", receivePayment);
router.put("/:billId/credit", toggleBillCredit);

module.exports = router;
