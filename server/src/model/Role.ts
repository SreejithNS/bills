import { Schema, model, Types } from "mongoose";
import Service from "../service";
import { IOrganisation } from "./Organisation";
import { DefaultBase} from "../utils/Types";

// Interface for RoleSchema
export interface IRole extends DefaultBase {
	organisation: Types.ObjectId;
	name: string;
	permissions: string[];
}

export interface IRolePopulated {
	organisation: IOrganisation | null;
}

const RoleSchema = new Schema<IRole>(
	{
		organisation: {
			type: Schema.Types.ObjectId,
			ref: "Organisation",
			required: true,
		},
		name: {
			type: String,
			required: true,
			// Role name should not contain spaces
			validate: {
				validator: (v: string) => !v.includes(" "),
				message: (props) => `${props.value} contains spaces`,
			},
		},
		permissions: {
			type: [String],
			required: true,

			// Permissions should be from list of permissions in Service
			validate: {
				validator: (v: string[]) =>
					v.every((permission) => Service.allPermissions.includes(permission)),
				message: (props) => {
					const invalidPermissions = props.value.filter(
						(permission) => !Service.allPermissions.includes(permission)
					) as string[];
					return `${invalidPermissions.join(",")} are invalid permissions`;
				},
			},
		},
	},
	{
		timestamps: true,
	}
);

// Role name should be unique for an organisation
RoleSchema.index({ name: 1, organisation: 1 }, { unique: true });

const Role = model<IRole>("Role", RoleSchema);

export default Role;
