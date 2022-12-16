var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

var Schema = mongoose.Schema;

/**
 * @class Product
 */
const ProductSchema = new Schema(
	{
		code: { type: String, required: true, index: true },
		name: { type: String, required: true },
		primaryUnit: { type: String, default: "Unit", required: true },
		units: {
			type: [
				{
					name: String,
					rate: {
						type: Number,
						default: 0,
					},
					cost: {
						type: Number, default: 0
					},
					conversion: {
						type: Number, default: 1
					},
					mrp: {
						type: Number,
						default: 0,
					},
				},
			],
			default: []
		},
		cost: { type: Number, default: 0 },
		hsn: { type: String, default: "" },
		sgst: { type: Number, default: 0, required: true },
		cgst: { type: Number, default: 0, required: true },
		gstInclusive: { type: Boolean, default: false, required: true },
		stocked: { type: Boolean, default: false },
		stock: { type: Number, default: 0 },
		quantity: { type: Number, default: 0 },
		category: { type: Schema.Types.ObjectId, ref: "ProductCategory" },
		rate: { type: Number, default: 0 },
		mrp: { type: Number, default: 0 },
		belongsTo: { type: Schema.Types.ObjectId, ref: "User", required: true }
	},
	{ timestamps: true }
);

ProductSchema.plugin(mongoosePaginate);
ProductSchema.index({ code: 1, category: 1 }, { unique: true });

module.exports = ProductSchema;
