const { Schema } = require("mongoose");

module.exports = new Schema({
	permissions: {
		type: [String],
		default: []
	}
});
