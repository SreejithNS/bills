var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const LocationSchema = require("./LocationSchema");

const CustomerSchema = new Schema(
	{
        name: { type: String, required: true },
        place: String,
		location: {
			type:LocationSchema,
			required:false
		},
		createdBy:{type:Schema.Types.ObjectId , ref:"User"}
	},
	{ timestamps: true }
);

module.exports = CustomerSchema;
