var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

var Schema = mongoose.Schema;

const ProductSchema = new Schema(
	{
		code: { type: String, required: true, index: true },
		name: { type: String, required: true },
		units: [
			{
				name: String,
				rate: {
					type: Number,
					default: 0,
				},
				mrp: {
					type: Number,
					default: 0,
				},
			},
		],
		category: { type: String, index: true, default: "general" },
		rate: { type: Number, default: 0 },
		mrp: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

ProductSchema.plugin(mongoosePaginate);
ProductSchema.index({ code: 1, category: 1 }, { unique: true });

module.exports = ProductSchema;
