var mongoose = require("mongoose");

var Schema = require("./schemas/BillSchema");

exports.Bill = mongoose.model("Bill", Schema);