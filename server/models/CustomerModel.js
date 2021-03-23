var mongoose = require("mongoose");

var Schema = require("./schemas/CustomerSchema");

exports.Customer = mongoose.model("Customer", Schema);