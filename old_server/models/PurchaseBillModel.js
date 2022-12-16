var mongoose = require("mongoose");

var Schema = require("./schemas/PurchaseBillSchema");

exports.PurchaseBill = mongoose.model("PurchaseBill", Schema);