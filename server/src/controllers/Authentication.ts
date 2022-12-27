import { NextFunction, Request, Response } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import { HydratedDocument } from "mongoose";
import { body } from "express-validator";
import Controller, { IRoute, Methods } from ".";
import { AuthenticationError } from "../utils/Errors";
import AuthenticationService from "../service/Authentication";
import AuthorizationService from "../service/Authorization";
import { CreateResponse, SuccessResponse, SuccessResponseWithData } from "../utils/Responses";
import Authorization from "./Authorization";
import { IUser } from "../model/User";
import Pagination from "../utils/Pagination";

class Authentication extends Controller {
	public middlewares = {
		authenticate: this.authenticateMiddleware,
	};

	public path = "/auth";

	protected routes: IRoute[] = [
		{
			path: "/login",
			method: Methods.POST,
			handler: this.login,
			validation: [
				body("username").isString().isLength({ min: 4 }),
				body("password").isString().isLength({ min: 4 }),
			],
			localMiddleware: [],
		},
		{
			path: "/logout",
			method: Methods.POST,
			handler: this.logout,
			localMiddleware: [this.middlewares.authenticate],
		},
		{
			path: "/username/:username",
			method: Methods.GET,
			handler: this.getUserByUsername,
			localMiddleware: [
				this.middlewares.authenticate,
				Authorization.authorizeWithBypassForAdmins(
					AuthenticationService.permissions.GET_USER
				),
			],
		},
		{
			path: "/",
			method: Methods.POST,
			handler: this.registerUser,
			validation: [
				body("username").isString().isLength({ min: 4 }),
				body("password").isString().isLength({ min: 4 }),
				body("roles").optional().isArray().isMongoId(),
				body("permissions").optional().isArray().isString(),
			],
			localMiddleware: [
				this.middlewares.authenticate,
				Authorization.authorizeWithBypassForAdmins(
					AuthenticationService.permissions.CREATE_USER
				),
			],
		},
		{
			path: "/",
			method: Methods.GET,
			handler: this.getUsers,
			localMiddleware: [
				this.middlewares.authenticate,
				Authorization.authorizeWithBypassForAdmins(
					AuthenticationService.permissions.GET_USER
				),
			],
		},
		{
			path: "/me",
			method: Methods.GET,
			handler: this.getCurrentUser,
			localMiddleware: [this.middlewares.authenticate],
		},
		{
			path: "/:id",
			method: Methods.PUT,
			handler: this.updateUser,
			validation: [
				body("username").optional().isString().isLength({ min: 4 }),
				body("password").optional().isString().isLength({ min: 4 }),
				body("roles").optional().isArray().isMongoId(),
				body("permissions").optional().isArray().isString(),
			],
			localMiddleware: [
				this.middlewares.authenticate,
				Authorization.authorizeWithBypassForAdmins(
					AuthenticationService.permissions.UPDATE_USER
				),
			],
		},
	];

	private getTokenFromRequest(req: Request): string | null {
		// Get token from header or request body or cookies
		if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
			return req.headers.authorization.split(" ")[1];
		}

		if (req.body && req.body.token) {
			return req.body.token;
		}

		if (req.cookies && req.cookies.token) {
			return req.cookies.token;
		}

		return null;
	}

	private async authenticateMiddleware(req: Request, res: Response, next: NextFunction) {
		const token = this.getTokenFromRequest(req);

		if (token) {
			// Verify token
			// If token is valid, attach user to request
			// If token is invalid, return AuthenticationError

			try {
				const auth = (await verify(token, process.env.JWT_SECRET ?? "")) as JwtPayload;

				if (auth) {
					req.auth = auth;
					return next();
				}
			} catch (error) {
				switch (error.name) {
					case "TokenExpiredError":
						this.clearAuthCookie(res);
						return new AuthenticationError(
							"Authentication Token expired"
						).handleResponse(res);

					case "JsonWebTokenError":
						this.clearAuthCookie(res);
						return new AuthenticationError(
							"Invalid Authentication token"
						).handleResponse(res);

					case "NotBeforeError":
						return new AuthenticationError(
							"Authentication Token not active"
						).handleResponse(res);

					default:
						return new AuthenticationError(
							"Token Authentication failed"
						).handleResponse(res);
				}
			}
		}
		return new AuthenticationError("No Authentication token provided").handleResponse(res);
	}

	private setAuthCookie(res: Response, cookie: string) {
		// Set cookie to response
		res.cookie("token", cookie, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
		});
	}

	private clearAuthCookie(res: Response) {
		// Clear cookie from response
		res.clearCookie("token");
	}

	public async login(req: Request, res: Response) {
		// Get username and password from request body
		const { username, password } = req.body;

		try {
			const user = await AuthenticationService.login(username, password);

			const token = await AuthenticationService.generateToken(user);

			this.setAuthCookie(res, token);

			return new SuccessResponseWithData(res, "Login successful", {
				...user,
				token,
			}).respond();
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	public logout(_req: Request, res: Response) {
		// Clear cookie
		this.clearAuthCookie(res);

		return new SuccessResponse(res, "Logout successful").respond();
	}

	public async registerUser(req: Request, res: Response) {
		// Get username and password from request body
		const {
			username,
			password,
			roles,
			permissions,
		}: {
			username: string;
			password: string;
			roles?: string[];
			permissions?: string[];
		} = req.body;

		try {
			const user = await AuthenticationService.createUser({
				username,
				password,
				organisation: req.auth.organisation,
			});

			if (roles) {
				// Check if the organisation has the roles
				user.roles = await AuthorizationService.validateRolesForOrganisation(
					roles,
					req.auth.organisation
				);
			}
			if (permissions) {
				// Check if the organisation has the permissions
				user.extraPermissions = await AuthorizationService.validatePermissionsForUser(
					permissions,
					req.auth.permissions
				);
			}

			await user.save();

			return new CreateResponse(res, "User registered", user).respond();
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	public async updateUser(req: Request, res: Response) {
		// Get username and password from request body
		const {
			username,
			password,
			roles,
			permissions,
		}: {
			username?: string;
			password?: string;
			roles?: string[];
			permissions?: string[];
		} = req.body;

		const user = (await AuthenticationService.getUserById(
			req.params.id
		)) as unknown as HydratedDocument<IUser>;

		if (username) {
			user.username = username;
		}

		if (password) {
			user.password = await AuthenticationService.encryptPassword(password);
		}

		if (roles) {
			// Check if the organisation has the roles
			user.roles = await AuthorizationService.validateRolesForOrganisation(
				roles,
				req.auth.organisation
			);
		}
		if (permissions) {
			// Check if the organisation has the permissions
			user.extraPermissions = await AuthorizationService.validatePermissionsForUser(
				permissions,
				req.auth.permissions
			);
		}

		await user.save();

		return new SuccessResponseWithData(res, "User updated", user).respond();
	}

	public async getUserByUsername(req: Request, res: Response) {
		try {
			const user = await AuthenticationService.getUserByUsernameAndOrganisation(
				req.params.username,
				req.auth.organisation
			);

			return new SuccessResponseWithData(res, "User found", user).respond();
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	public async getUsers(req: Request, res: Response) {
		try {
			const pagination = new Pagination<IUser>({
				blacklist: ["password", "organisation"],
			});

			const query = pagination.getQuery(req.query, {
				organisation: req.auth.organisation,
			});

			const users = await AuthenticationService.paginateUsers(query);

			return new SuccessResponseWithData(res, "Paginated Result", users).respond();
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	public async getCurrentUser(req: Request, res: Response) {
		try {
			const user = await AuthenticationService.getUserById(req.auth.id);

			return new SuccessResponseWithData(res, "Current User", user).respond();
		} catch (error) {
			return this.handleError(error, res);
		}
	}
}

export default new Authentication();