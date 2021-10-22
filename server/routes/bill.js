var express = require("express");
const { getAllBills, getBill, getProductWiseSalesAsCSV, getAllBillsAsCSV, receivePayment, deletePayment, deleteBill, saveBill, toggleBillCredit } = require("../controllers/BillController");

var router = express.Router();

router.post("/", saveBill);
router.get("/", getAllBills);
router.get("/asCSV", getAllBillsAsCSV);
router.get("/productSalesAsCSV", getProductWiseSalesAsCSV);
router.get("/id/:billId", getBill);
router.delete("/id/:billId", deleteBill);

router.post("/:billId/payment", receivePayment);
router.put("/:billId/credit", toggleBillCredit);
router.delete("/:billId/payment/:paymentId", deletePayment);
module.exports = router;
