import mongoose from "mongoose";
import { Permissions } from "../utils/Permissions";

export default abstract class Service {
	public abstract readonly entityName: string;

	public abstract readonly populateOptions:
		| mongoose.PopulateOptions[]
		| Record<string, mongoose.PopulateOptions[]>;

	public abstract readonly permissions: Permissions;

	public static allPermissions: string[];

	static entityName: string;

	private static formatEntity(entityName: string): string {
		return (
			entityName
				.trim()
				.replace(/[\s.]/g, "_") // Replaces all spaces and dots with underscores
				.toUpperCase()
		);
	}

	private static generatePermissions<T extends Permissions>(entityName: string, prop: T) {
		const s: Record<string, string> = {};

		for (const key of Object.values(prop)) {
			const entityNameFromatted = Service.formatEntity(entityName);
			const permission = `${entityNameFromatted}_${prop[prop[key]]}`;
			s[key] = permission;
		}

		return s as unknown as T;
	}

	protected generatePermissions<T extends Permissions>(args: T): T {
		return Service.generatePermissions<T>(this.entityName, args);
	}
}
