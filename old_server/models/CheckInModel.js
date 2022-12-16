var mongoose = require("mongoose");

var Schema = require("./schemas/CheckInSchema");

exports.CheckIn = mongoose.model("CheckIn", Schema);
