const { Schema } = require("mongoose");

module.exports = new Schema({
	restrictedRoutes: [
		{
			type: String,
			required: false,
			default: [],
		},
	],
});
