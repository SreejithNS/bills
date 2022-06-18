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
		organisation: {
			type: {
				name: { type: String, required: true, default: "Organisation" },
				printTitle: { type: String, default: "Billz App" },
				upivpa: { type: String, default: "" },
				upiname: { type: String, default: "" },
				tagline: String,
				printHeader: { type: String, default: "( Quotation )" },
				printFooter: String,
				checkInSettings: {
					customerRequired: { type: Boolean, default: false },
					productsRequired: { type: Boolean, default: false },
					noteRequired: { type: Boolean, default: false },
					notePresets: { type: [String], default: ["No Order"] },
					distanceThreshold: { type: Number, default: 200 },
					dateFields: {
						type: [{
							name: { type: String, required: true },
							label: { type: String, required: true },
							required: { type: Boolean, required: true },
						}],
						default: []
					}
				}
			},
			required: false,
			default: {
				name: "Organisation",
				printTitle: "Billz App",
				tagline: "",
				printHeader: "( Quotation )",
				printFooter: "",
				checkInSettings: {
					customerRequired: false,
					productsRequired: false,
					noteRequired: false,
					notePresets: ["No Order"],
					dateFields: [],
					distanceThreshold: 200
				}
			}
		}
	},
	{ timestamps: true }
);

exports.User = mongoose.model("User", UserSchema);
