var mongoose = require("mongoose");

var Schema = require("./schemas/PaymentSchema");

module.exports = mongoose.model("Payment", Schema);
