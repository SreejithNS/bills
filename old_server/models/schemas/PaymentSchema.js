const { Schema } = require("mongoose");

module.exports = new Schema(
	{
		paidAmount: {
			type: Number,
			required: true,
			default: 0,
		},
		paymentReceivedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{ timestamps: true }
);
