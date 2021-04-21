var mongoose = require("mongoose");
const privilegeEnum = require("../helpers/privilegeEnum");
const UserSettingsSchema = require("./schemas/UserSettingsSchema");

var UserSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		phone: { type: Number, required: true, indexes: { unique: true } },
		type: { type: Number, default: privilegeEnum.admin },
		belongsTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		password: { type: String, required: true },
		status: { type: Boolean, required: true, default: 1 },
		settings: {
			type: UserSettingsSchema
		},
	},
	{ timestamps: true }
);

exports.User = mongoose.model("User", UserSchema);
