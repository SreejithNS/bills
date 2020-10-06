const { Schema } = require("mongoose");

module.exports = new Schema({
	type: {
		type: String,
		enum: ["Point"],
		required: true
	},
	coordinates: {
		type: [Number],
		required: true
	}
});