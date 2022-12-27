import { Schema, model, Types, PaginateModel } from "mongoose";
import * as mongooseDelete from "mongoose-delete";
import { SoftDeleteDocument, SoftDeleteModel } from "mongoose-delete";
import * as paginate from "mongoose-paginate-v2";
import Service from "../service";
import { ISettings } from "./Settings";

// Interface for OrganisationSchema
export interface IOrganisation extends SoftDeleteDocument {
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

OrganisationSchema.plugin(paginate);
OrganisationSchema.plugin(mongooseDelete, {
	overrideMethods: true,
	deletedAt: true,
	deletedBy: true,
	deletedByType: Schema.Types.ObjectId,
	indexFields: true,
	validateBeforeDelete: false,
});

type Model = SoftDeleteModel<IOrganisation> & PaginateModel<IOrganisation>;

const Organisation = model<IOrganisation, Model>("Organisation", OrganisationSchema);

export default Organisation;
