var mongoose = require("mongoose");

/**
 * @class Product
 */
var Schema = require("./schemas/ProductSchema");

exports.Product = mongoose.model("Product", Schema);