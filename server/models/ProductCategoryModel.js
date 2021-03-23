var mongoose = require("mongoose");

var Schema = require("./schemas/ProductCategorySchema");

exports.ProductCategory = mongoose.model("ProductCategory", Schema);