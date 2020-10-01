var mongoose = require("mongoose");

var Schema = require("./schemas/CustomerSchema");

module.exports = mongoose.model("Customer", Schema);