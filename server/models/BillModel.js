var mongoose = require("mongoose");

var Schema = require("./schemas/BillSchema");

module.exports = mongoose.model("Bill", Schema);