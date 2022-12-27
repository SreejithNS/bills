import { Schema, model, Types, PaginateModel } from "mongoose";
import * as paginate from "mongoose-paginate-v2";
import * as mongooseDelete from "mongoose-delete";
import { SoftDeleteDocument, SoftDeleteModel } from "mongoose-delete";
import { IOrganisation } from "./Organisation";
import { IRole } from "./Role";
import { ISettings } from "./Settings";

// Interface for UserSchema
export interface IUser extends SoftDeleteDocument {
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
			minlength: 4,
		},
		password: { type: String, required: true },
		status: { type: Boolean, required: true, default: true },
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
		toObject: {
			transform: function (doc, ret: IUser) {
				// eslint-disable-next-line no-param-reassign
				delete ret.password;
			},
		},
		toJSON: {
			transform: function (doc, ret: IUser) {
				// eslint-disable-next-line no-param-reassign
				delete ret.password;
			},
		},
	}
);

UserSchema.index({ username: 1, organisation: 1 }, { unique: true });

UserSchema.plugin(paginate);
UserSchema.plugin(mongooseDelete, {
	overrideMethods: true,
	deletedAt: true,
	deletedBy: true,
	deletedByType: Schema.Types.ObjectId,
	indexFields: true,
	validateBeforeDelete: false,
});

type Model = SoftDeleteModel<IUser> & PaginateModel<IUser>;

const User = model<IUser, Model>("User", UserSchema);

export default User;
