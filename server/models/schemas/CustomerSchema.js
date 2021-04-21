var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");
const LocationSchema = require("./LocationSchema");

const CustomerSchema = new Schema(
	{
		name: { type: String, required: true, index: true },
		phone: { type: Number, required: true, index: true },
		place: String,
		location: {
			type: LocationSchema,
			required: false
		},
		belongsTo: { type: Schema.Types.ObjectId, ref: "User" }
	},
	{ timestamps: true }
);

CustomerSchema.plugin(mongoosePaginate);
CustomerSchema.index({ phone: 1, belongsTo: 1 }, { unique: true });

module.exports = CustomerSchema;
