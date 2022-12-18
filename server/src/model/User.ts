import { Schema, model, Types } from "mongoose";
import { IOrganisation } from "./Organisation";
import { IRole } from "./Role";
import { ISettings } from "./Settings";
import { DefaultBase, Deletion } from "./types";

// Interface for UserSchema
export interface IUser extends DefaultBase, Deletion {
	name: string;
	username: string;
	password: string;
	status: boolean;
	organisation: Types.ObjectId;
	roles: Types.ObjectId[];
	extraPermissions: string[];
	settings: Types.ObjectId;
}

export interface IUserPopulated {
	organisation: IOrganisation | null;
	roles: IRole[] | null;
	settings: ISettings | null;
}

const UserSchema = new Schema<IUser>(
	{
		name: { type: String, required: true },
		username: {
			type: String,
			required: true,
			indexes: { unique: true },
			minlength: 4,
		},
		password: { type: String, required: true },
		status: { type: Boolean, required: true, default: true },
		deletedAt: { type: Date, required: false, default: null },
		organisation: {
			type: Schema.Types.ObjectId,
			ref: "Organisation",
			required: true,
		},
		// TODO: Organisation wide settings object reference here (from settings collection)
		roles: [
			{
				type: Schema.Types.ObjectId,
				ref: "Role",
			},
		],
		extraPermissions: {
			type: [String],
			required: true,
			default: [],
		},
		settings: {
			type: Schema.Types.ObjectId,
			ref: "Settings",
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

UserSchema.index({ username: 1, organisation: 1 }, { unique: true });

// const UserSchema = new Schema(
// 	{
// 		name: { type: String, required: true },
// 		phone: { type: Number, required: true, indexes: { unique: true } },
// 		type: { type: Number, default: privilegeEnum.admin },
// 		belongsTo: { type: Schema.Types.ObjectId, ref: "User" },
// 		password: { type: String, required: true },
// 		status: { type: Boolean, required: true, default: 1 },
// 		settings: {
// 			type: UserSettingsSchema,
// 		},
// 		organisation: {
// 			type: {
// 				name: { type: String, required: true, default: "Organisation" },
// 				printTitle: { type: String, default: "Billz App" },
// 				upivpa: { type: String, default: "" },
// 				upiname: { type: String, default: "" },
// 				tagline: String,
// 				printHeader: { type: String, default: "( Quotation )" },
// 				printDiscountLabel: { type: String, default: "Discount" },
// 				printFooter: String,
// 				checkInSettings: {
// 					customerRequired: { type: Boolean, default: false },
// 					productsRequired: { type: Boolean, default: false },
// 					noteRequired: { type: Boolean, default: false },
// 					notePresets: { type: [String], default: ["No Order"] },
// 					distanceThreshold: { type: Number, default: 200 },
// 					dateFields: {
// 						type: [
// 							{
// 								name: { type: String, required: true },
// 								label: { type: String, required: true },
// 								required: { type: Boolean, required: true },
// 							},
// 						],
// 						default: [],
// 					},
// 				},
// 			},
// 			required: false,
// 			default: {
// 				name: "Organisation",
// 				printTitle: "Billz App",
// 				tagline: "",
// 				printHeader: "( Quotation )",
// 				printFooter: "",
// 				checkInSettings: {
// 					customerRequired: false,
// 					productsRequired: false,
// 					noteRequired: false,
// 					notePresets: ["No Order"],
// 					dateFields: [],
// 					distanceThreshold: 200,
// 				},
// 			},
// 		},
// 	},
// 	{ timestamps: true }
// );

const User = model<IUser>("User", UserSchema);

export default User;
