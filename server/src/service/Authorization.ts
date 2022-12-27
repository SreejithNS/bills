import { JwtPayload } from "jsonwebtoken";
import { HydratedDocument, PopulateOptions, Types } from "mongoose";
import Service from ".";
import Role, { IRole, IRolePopulated } from "../model/Role";
import { Permission } from "../utils/Permissions";
import { PopulatedHydratedDocument } from "../utils/Types";
import Authentication from "./Authentication";

class Authorization extends Service {
	public entityName = "role";
	
	public permissions = this.generatePermissions(Permission.Authorization);

	readonly DEFAULT_ADMIN_PERMISSIONS = [];

	readonly RESERVED_ROLE_NAMES = ["ADMIN", "ROOT"];

	public populateOptions: PopulateOptions[] = [
		{
			path: "organisation",
		},
	];

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

	public async getOrganisationRoles(
		id: string
	): Promise<PopulatedHydratedDocument<IRole, IRolePopulated>[]> {
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

	public async checkAuthorizationFromJWT(
		jwt: JwtPayload,
		...permissions: string[]
	): Promise<boolean> {
		const userPermissions = jwt.permissions;

		const hasPermission = permissions.every((permission) =>
			userPermissions.includes(permission)
		);

		return hasPermission;
	}

	public async validateRolesForOrganisation(roles: string[], organisation: string) {
		const organisationRoles = (await this.getOrganisationRoles(organisation)).map((role) =>
			role._id.toString()
		);

		const validRoles = roles.filter((role) => organisationRoles.includes(role));

		if (validRoles.length > 0) {
			return validRoles.map((rolesId) => new Types.ObjectId(rolesId));
		}

		return [];
	}

	public async validatePermissionsForUser(permissions: string[], userPermissions: string[]) {
		const validPermissions = permissions.filter((permission) =>
			userPermissions.includes(permission)
		);

		if (validPermissions.length > 0) {
			return validPermissions;
		}

		return [];
	}
}

export default new Authorization();
