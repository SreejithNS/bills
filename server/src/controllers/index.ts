import { Response, Request, NextFunction, Router } from "express";
import { ValidationChain, validationResult } from "express-validator";
import mongoose from "mongoose";
import { MiddlewareFunction } from "../utils/Types";
import {
	ErrorResponse,
	InternalServerError,
	MongooseValidationError,
	ValidationError,
} from "../utils/Errors";

// HTTP methods
export enum Methods {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
	ALL = "ALL",
}

// Route interface for each route in `routes` field of `Controller` class.
export interface IRoute {
	path: string;
	method: Methods;
	handler: (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
	localMiddleware: ((req: Request, res: Response, next: NextFunction) => void | Promise<void>)[];
	validation?: ValidationChain[];
}

export default abstract class Controller {
	// Router instance for mapping routes
	public router: Router = Router();

	// The path on which this.routes will be mapped
	public abstract path: string;

	// Array of Middleware functions for this Controller
	public abstract middlewares: Record<
		string,
		((...arg0: unknown[]) => Promise<MiddlewareFunction>) | MiddlewareFunction
	>;

	// Array of objects which implement IRoutes interface
	protected abstract readonly routes: Array<IRoute>;

	public setRoutes(): Router {
		// Set HTTP method, middleware, and handler for each route
		// Returns Router object, which we will use in Server class
		for (const route of this.routes) {
			for (const mw of route.localMiddleware) {
				this.router.use(route.path, mw);
			}

			const routeArguments: [
				string,
				...IRoute["localMiddleware"],
				ReturnType<typeof this.validate> | undefined,
				IRoute["handler"]
			] = [
				route.path,
				...route.localMiddleware,
				this.validate(route.validation),
				route.handler.bind(this),
			];

			switch (route.method) {
				case "GET":
					this.router.get(...routeArguments);
					break;
				case "POST":
					this.router.post(...routeArguments);
					break;
				case "PUT":
					this.router.put(...routeArguments);
					break;
				case "DELETE":
					this.router.delete(...routeArguments);
					break;
				case "ALL":
					this.router.all(...routeArguments);
					break;
				default:
				// Throw exception
			}
		}
		// Return router instance (will be usable in Server class)
		return this.router;
	}

	protected validate(validations?: ValidationChain[]) {
		return async (req: Request, res: Response, next: NextFunction) => {
			if (!validations || validations.length === 0) return next();

			await Promise.all(validations.map((validation) => validation.run(req)));

			const errors = validationResult(req);
			if (errors.isEmpty()) {
				return next();
			}

			return new ValidationError("Validation failed", errors).handleResponse(res);
		};
	}

	protected handleError(error: Error, res: Response) {
		if (error instanceof ErrorResponse) {
			return error.handleResponse(res);
		}
		if (error instanceof mongoose.Error.ValidationError) {
			return new MongooseValidationError(error).handleResponse(res);
		}

		return new InternalServerError(error.message).handleResponse(res);
	}
}
