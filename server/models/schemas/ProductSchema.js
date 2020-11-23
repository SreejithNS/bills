var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

var Schema = mongoose.Schema;

const ProductSchema = new Schema(
	{
		code: { type: String, required: true, index: { unique: true } },
		name: { type: String, required: true },
		weight: { type: Number },
		weightUnit: { type: String },
		rate: { type: Number, default: 0 },
		mrp: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

ProductSchema.plugin(mongoosePaginate);

module.exports = ProductSchema;
