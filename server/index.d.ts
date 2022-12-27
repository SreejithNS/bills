import { JwtPayload } from "jsonwebtoken";

export {};

declare global {
	namespace Express {
		export interface Request {
			auth: JwtPayload;
		}
	}
}

declare module "jsonwebtoken" {
	export interface JwtPayload {
		id: string;
		roles: string[];
		permissions: string[];
		organisation: string;
	}
}
