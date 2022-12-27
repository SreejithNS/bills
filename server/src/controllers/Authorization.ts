import { NextFunction, Request, Response } from "express";
import Controller, { IRoute } from ".";
import { AuthorizationError } from "../utils/Errors";
import AuthorizationService from "../service/Authorization";

class Authorization extends Controller {
	public middlewares = {};

	public path = "/roles";

	protected routes: IRoute[] = [];

	public authorize(...expectedPermissions: (string | number)[]) {
		return async (req: Request, res: Response, next: NextFunction) => {
			if (
				!AuthorizationService.checkAuthorizationFromJWT(
					req.auth,
					...expectedPermissions.map((permission) => permission.toString())
				)
			) {
				return new AuthorizationError(
					"You are not authorized to access this resource"
				).handleResponse(res);
			}

			return next();
		};
	}

	public authorizeWithBypassForAdmins(...expectedPermissions: (string | number)[]) {
		return async (req: Request, res: Response, next: NextFunction) => {
			if (
				AuthorizationService.checkAuthorizationFromJWT(
					req.auth,
					AuthorizationService.permissions.IS_ADMIN.toString()
				) ||
				AuthorizationService.checkAuthorizationFromJWT(
					req.auth,
					AuthorizationService.permissions.IS_ROOT.toString()
				)
			)
				return next();

			return this.authorize(...expectedPermissions)(req, res, next);
		};
	}
}

export default new Authorization();
