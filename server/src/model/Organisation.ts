import { Schema, model, Types } from "mongoose";
import Service from "../service";
import { ISettings } from "./Settings";
import { DefaultBase, Deletion } from "./types";

// Interface for OrganisationSchema
export interface IOrganisation extends DefaultBase,Deletion {
	name: string;
	tagline: string;
	allottedPermissions: string[];
	settings: Types.ObjectId;
}

export interface IOrganisationPopulated {
	settings: ISettings | null;
}


const OrganisationSchema = new Schema<IOrganisation>(
	{
		name: { type: String, required: true, default: "Organisation" },
		tagline: { type: String, required: true, default: "BillzApp" },
		allottedPermissions: {
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
		settings: {
			type: Schema.Types.ObjectId,
			ref: "Settings",
			required: true,
		},
		deletedAt: { type: Date, required: false, default: null },
	},
	{
		timestamps: true,
	}
);

const Organisation = model<IOrganisation>("Organisation", OrganisationSchema);

export default Organisation;