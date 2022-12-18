import mongoose from "mongoose";

export default abstract class Service {
	public abstract readonly entityName: string;

	public abstract readonly populateOptions:
		| mongoose.PopulateOptions[]
		| Record<string, mongoose.PopulateOptions[]>;

	public abstract readonly permissions: string[];

	public static allPermissions: string[];

	static entityName: string;

	protected static createPermissions(...args: string[]): string[] {
		return args.map((arg) => {
			const permission = `${this.entityName.toUpperCase()}_${arg
				.trim()
				.toUpperCase()
				// Replace spaces and dots with underscores
				.replace(/(\s|\.)+/g, "_")}`;
			Service.allPermissions.push(permission);
			return permission;
		});
	}
}
