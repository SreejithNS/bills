import { NextFunction, Request, Response } from "express";
import { HydratedDocument, Types } from "mongoose";

export interface Timestamps {
	createdAt: Date;
	updatedAt: Date;
}

export interface Deletion {
	deletedAt?: Date;
	deletedBy?: {
		user: Types.ObjectId;
		name: string;
	};
	deleted: boolean;
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

export type MiddlewareFunction = (
	req: Request,
	res: Response,
	next: NextFunction
) => Promise<unknown> | unknown;
