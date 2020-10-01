var mongoose = require("mongoose");

var Schema = require("./schemas/ProductSchema");

module.exports = mongoose.model("Product", Schema);