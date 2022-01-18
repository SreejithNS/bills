var express = require("express");
const { getAllBills, getBill, getProductWiseSalesAsCSV, getAllBillsAsCSV, receivePayment, deletePayment, deleteBill, savePurchaseBill, toggleBillCredit } = require("../controllers/PurchaseBills/index");

var router = express.Router();

router.post("/", savePurchaseBill);
router.get("/", getAllBills);
router.get("/asCSV", getAllBillsAsCSV);
router.get("/productSalesAsCSV", getProductWiseSalesAsCSV);
router.get("/id/:billId", getBill);
router.delete("/id/:billId", deleteBill);

router.post("/:billId/payment", receivePayment);
router.put("/:billId/credit", toggleBillCredit);
router.delete("/:billId/payment/:paymentId", deletePayment);
module.exports = router;
