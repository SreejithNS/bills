var mongoose = require("mongoose");

var Schema = require("./schemas/ProductSchema");

exports.Product = mongoose.model("Product", Schema);