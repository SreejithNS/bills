import { HydratedDocument, Types } from "mongoose";

export interface Timestamps {
	createdAt: Date;
	updatedAt: Date;
}

export interface Deletion {
	deletedAt: Date | null;
}

export interface DefaultBase extends Timestamps {
	_id: Types.ObjectId;
}

export type PopulatedHydratedDocument<Doc, PopulatedFields> = Omit<
	HydratedDocument<Doc> &
		Doc & {
			_id: Types.ObjectId;
		},
	keyof PopulatedFields
> &
	PopulatedFields;
