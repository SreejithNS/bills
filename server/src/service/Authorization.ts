import { HydratedDocument, PopulateOptions } from "mongoose";
import Service from ".";
import Role, { IRole, IRolePopulated } from "../model/Role";
import { PopulatedHydratedDocument } from "../model/types";
import Authentication from "./Authentication";
import { ValidationError } from "./Errors";

class Authorization extends Service {
	public permissions: string[] = Service.createPermissions("create", "read", "update", "delete");

	readonly DEFAULT_ADMIN_PERMISSIONS = [];

	readonly RESERVED_ROLE_NAMES = ["ADMIN", "ROOT"];

	public populateOptions: PopulateOptions[] = [
		{
			path: "organisation",
		},
	];

	public entityName = "role";

	public async createDefaultAdminRole(organisationId: string): Promise<HydratedDocument<IRole>> {
		const role = new Role({
			name: "ADMIN",
			permissions: this.DEFAULT_ADMIN_PERMISSIONS,
			organisation: organisationId,
		});
		await role.save();

		return role;
	}

	public async create({
		name,
		permissions,
		organisation,
	}: IRole): Promise<HydratedDocument<IRole>> {
		const role = new Role({
			name,
			permissions,
			organisation,
		});
		await role.save();

		return role;
	}

	public async getRoleById(id: string): Promise<HydratedDocument<IRole>> {
		const role = await Role.findById(id).populate(this.populateOptions);
		return role;
	}

	public async update(
		id: string,
		{ name, permissions, organisation }: Partial<IRole>
	): Promise<HydratedDocument<IRole>> {
		const role = await this.getRoleById(id);

		if (name) role.name = name;
		if (permissions) role.permissions = permissions;
		if (organisation) role.organisation = organisation;

		if (name && this.RESERVED_ROLE_NAMES.includes(name.trim().toUpperCase()))
			throw new ValidationError("Role name is reserved");

		await role.save();

		return role;
	}

	public async getRole(id: string): Promise<HydratedDocument<IRole>> {
		const role = await this.getRoleById(id);
		return role;
	}

	public async getUserRoles(id: string): Promise<HydratedDocument<IRole>[]> {
		const user = await Authentication.getUserById(id);

		return user.roles as HydratedDocument<IRole>[];
	}

	public async getUserPermissions(id: string): Promise<IRole["permissions"]> {
		const user = await Authentication.getUserById(id);
		const userRolePermissions = user.roles.map((role) => role.permissions).flat();

		const permissions = new Set([...userRolePermissions, ...user.extraPermissions]);

		return Array.from(permissions);
	}

	public async getPermissionsFromRoles(...roleIds: string[]): Promise<IRole["permissions"]> {
		const roles = await Role.find({ _id: { $in: roleIds } });

		const permissions = roles.map((role) => role.permissions).flat();

		return permissions;
	}

	public async getOrganisationRoles(id: string): Promise<PopulatedHydratedDocument<IRole,IRolePopulated>[]> {
		const roles = await Role.find({ organisation: id }).populate<
			Pick<IRolePopulated, "organisation">
		>(this.populateOptions);

		return roles;
	}

	public async delete(id: string | string[]): Promise<void> {
		if (typeof id === "string") {
			await Role.deleteOne({ _id: id });
			return;
		}
		await Role.deleteMany({ _id: { $in: id } });
	}

	public async checkAuthorization(userId: string, ...permissions: string[]): Promise<boolean> {
		const userRoles = await this.getUserPermissions(userId);

		const hasPermission = permissions.every((permission) => userRoles.includes(permission));

		return hasPermission;
	}
}

export default new Authorization();
