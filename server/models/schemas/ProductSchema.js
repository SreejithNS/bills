var mongoose = require("mongoose");

var Schema = mongoose.Schema;

const ProductSchema = new Schema(
	{
		code: { type: String, required: true },
		name: { type: String, required: true },
		weight: { type: Number },
		weightUnit: { type: String },
		quantity:{type: Number},
		rate: { type: Number, default: 0 },
		mrp: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

module.exports = ProductSchema;
