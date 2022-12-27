import { HydratedDocument, PopulateOptions, Types } from "mongoose";
import { compare, genSalt, hash } from "bcrypt";
import * as jwt from "jsonwebtoken";
import { PaginationParameters } from "mongoose-paginate-v2";
import Service from ".";
import { PopulatedHydratedDocument } from "../utils/Types";
import User, { IUser, IUserPopulated } from "../model/User";
import {
	AuthenticationError,
	InternalServerError,
	MultipleChoiceFoundError,
	NotFoundError,
} from "../utils/Errors";
import Organisation, { IOrganisation, IOrganisationPopulated } from "../model/Organisation";
import { Permission } from "../utils/Permissions";

class Authentication extends Service {
	public entityName = "auth";

	public populateOptions: Record<"Organisation" | "User", PopulateOptions[]> = {
		Organisation: [
			{
				path: "settings",
			},
		],
		User: [
			{
				path: "organisation",
			},
			{
				path: "settings",
			},
			{
				path: "roles",
			},
		],
	};

	public static entityName = "Auth";

	public permissions = this.generatePermissions(Permission.Authentication);

	public static populateOptions: PopulateOptions[] = [];

	public async getUserById(
		id: string
	): Promise<PopulatedHydratedDocument<IUser, IUserPopulated>> {
		const user = await User.findById(id, "-password").populate<IUserPopulated>(
			this.populateOptions.User
		);

		return user;
	}

	public async getUsersByUsername(
		username: string
	): Promise<PopulatedHydratedDocument<IUser, IUserPopulated>[]> {
		const user = await User.find({ username }, "-password").populate<IUserPopulated>(
			this.populateOptions.User
		);

		return user;
	}

	public async getUserByUsernameAndOrganisation(
		username: string,
		organisation: string
	): Promise<PopulatedHydratedDocument<IUser, IUserPopulated>> {
		const user = await User.findOne(
			{ username, organisation },
			"-password"
		).populate<IUserPopulated>(this.populateOptions.User);

		return user;
	}

	public async encryptPassword(password: string): Promise<string> {
		const salt = await genSalt(10);
		const passwordHash = await hash(password, salt);
		return passwordHash;
	}

	public async comparePassword(password: string, passwordHash: string): Promise<boolean> {
		const result = await compare(password, passwordHash);
		return result;
	}

	public async login(
		username: string,
		password: string,
		organisation?: string
	): Promise<PopulatedHydratedDocument<IUser, IUserPopulated>> {
		let user: PopulatedHydratedDocument<IUser, IUserPopulated>;
		if (organisation) {
			user = await this.getUserByUsernameAndOrganisation(username, organisation);
		} else {
			const users = await this.getUsersByUsername(username);

			if (users.length > 1) {
				throw new MultipleChoiceFoundError(
					"User is present in multiple Organisations",
					users.map((u) => ({
						label: u.organisation.name,
						value: u.organisation._id.toString(),
					}))
				);
			}

			user = users.pop();
		}
		if (!user) {
			throw new NotFoundError("User not found");
		}

		const passwordMatch = await this.comparePassword(password, user.password);
		if (!passwordMatch) {
			throw new AuthenticationError("Incorrect password");
		}

		return user;
	}

	public async createOrganisation({
		name,
	}: Pick<IOrganisation, "name">): Promise<HydratedDocument<IOrganisation>> {
		const organisation = await Organisation.create({ name });
		return organisation;
	}

	public async createUser({
		username,
		password,
		organisation,
	}: Pick<IUser, "username" | "password"> & { organisation: string }): Promise<
		HydratedDocument<IUser>
	> {
		const passwordHash = await this.encryptPassword(password);
		const user = await User.create({ username, password: passwordHash, organisation });

		// Delete password
		user.password = undefined;

		return user;
	}

	public async register(
		username: string,
		password: string,
		organisationName: string
	): Promise<HydratedDocument<IUser>> {
		const organisation = await this.createOrganisation({ name: organisationName });
		const user = await this.createUser({ username, password, organisation: organisation.id });
		return user;
	}

	public async getOrganisationById(
		id: string
	): Promise<PopulatedHydratedDocument<IOrganisation, IOrganisationPopulated>> {
		const organisation = await Organisation.findOne({
			_id: id,
		}).populate<IOrganisationPopulated>(this.populateOptions.Organisation);

		return organisation;
	}

	public async generateToken(
		user: PopulatedHydratedDocument<IUser, IUserPopulated>
	): Promise<string> {
		const token = await jwt.sign(
			{
				id: user.id,
				permissions: [...user.roles.map((r) => r.permissions), ...user.extraPermissions],
				organisation: user.organisation,
			},
			process.env.JWT_SECRET,
			{
				expiresIn: "1d",
			}
		);
		return token;
	}

	public async updateUser(
		userId: string,
		data: Partial<IUser>
	): Promise<PopulatedHydratedDocument<IUser, IUserPopulated>> {
		const user = await this.getUserById(userId);
		if (!user) {
			throw new NotFoundError("User not found");
		}

		Object.assign(user, data);

		user.unmarkModified("password");

		await user.save();
		return user;
	}

	public async updateOrganisation(
		organisationId: string,
		data: Partial<IOrganisation>
	): Promise<PopulatedHydratedDocument<IOrganisation, IOrganisationPopulated>> {
		const organisation = await this.getOrganisationById(organisationId);
		if (!organisation) {
			throw new NotFoundError("Organisation not found");
		}

		Object.assign(organisation, data);

		await organisation.save();
		return organisation;
	}

	public async deleteUser(deletedBy: Types.ObjectId, ...userId: string[]): Promise<number> {
		const updates = await User.delete({ _id: { $in: userId } }, deletedBy).exec();

		if (updates.deletedCount === 0) {
			throw new NotFoundError("User not found");
		}

		if (updates.deletedCount !== userId.length) {
			throw new InternalServerError("Error deleting user");
		}

		return updates.deletedCount;
	}

	public async deleteOrganisation(
		deletedBy: Types.ObjectId,
		...organisationId: string[]
	): Promise<number> {
		const updates = await Organisation.delete(
			{ _id: { $in: organisationId } },
			deletedBy
		).exec();

		if (updates.deletedCount === 0) {
			throw new NotFoundError("Organisation not found");
		}

		if (updates.deletedCount !== organisationId.length) {
			throw new InternalServerError("Error deleting user");
		}

		return updates.deletedCount;
	}

	public async paginateUsers<T, O>(options: PaginationParameters<T, O>) {
		const users = await User.paginate(...options.get());

		return users;
	}
}

export default new Authentication();
