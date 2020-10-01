var mongoose = require("mongoose");

var Schema = mongoose.Schema;

const CustomerSchema = new Schema(
	{
        name: { type: String, required: true },
        place: String,
		location: {
			type: {
				type: String,
				enum: ["Point"],
				required: true
			},
			coordinates: {
				type: [Number],
				required: true
            }
		}
	},
	{ timestamps: true }
);

module.exports = CustomerSchema;
