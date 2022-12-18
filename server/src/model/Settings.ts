import { Schema, model, Types } from "mongoose";
import { DefaultBase} from "./types";

// Interface for SettingsSchema
export interface ISettings extends DefaultBase {
	organisation: Types.ObjectId;
	upi: {
		vpa: string;
		name: string;
	};
	thermalprint: {
		title: string;
		header: string;
		footer: string;
		label: {
			discount: string;
		};
	};
	checkIn: {
		customerRequired: boolean;
		productsRequired: boolean;
		noteRequired: boolean;
		notePresets: string[];
		distanceThreshold: number;
		dateFields: {
			name: string;
			label: string;
			required: boolean;
		}[];
	};
}

const SettingsSchema = new Schema<ISettings>(
	{
		organisation: {
			type: Schema.Types.ObjectId,
			ref: "Organisation",
			required: true,
			index: true,
		},
        upi:{
            vpa: { type: String, default: "" },
            name: { type: String, default: "" },
        },
        thermalprint: {
            title: { type: String, default: "Billz App" },
            header: { type: String, default: "( Quotation )" },
            footer: String,
            label: {
                discount: { type: String, default: "Discount" },
            }
        },
		checkIn: {
			customerRequired: { type: Boolean, default: false },
			productsRequired: { type: Boolean, default: false },
			noteRequired: { type: Boolean, default: false },
			notePresets: { type: [String], default: ["No Order"] },
			distanceThreshold: { type: Number, default: 200 },
			dateFields: {
				type: [
					{
						name: { type: String, required: true },
						label: { type: String, required: true },
						required: { type: Boolean, required: true },
					},
				],
				default: [],
			},
		},
	},
	{
		timestamps: true,
	}
);

const Settings = model<ISettings>("Settings", SettingsSchema);

export default Settings;