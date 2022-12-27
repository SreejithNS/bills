/* eslint-disable max-classes-per-file */
import { Response } from "express";
import { Result, ValidationError as ValidationErrorResult } from "express-validator";
import mongoose from "mongoose";

export abstract class ErrorResponse extends Error {
	responseMessage: string;

	constructor(message: string, protected res?: Response) {
		super(message);
		this.responseMessage = message;
	}

	abstract status: number;

	handleResponse(res: Response): void {
		res.status(this.status).send({ message: this.responseMessage });
	}
}

export class AuthenticationError extends ErrorResponse {
	status = 401;

	constructor(message: string) {
		super(message);
		this.name = "AuthenticationError";
	}
}

export class AuthorizationError extends ErrorResponse {
	status = 403;

	constructor(message: string) {
		super(message);
		this.name = "AuthorizationError";
	}
}

export class NotFoundError extends ErrorResponse {
	status = 404;

	constructor(message: string) {
		super(message);
		this.name = "NotFoundError";
	}
}

export class BadRequestError extends ErrorResponse {
	status = 400;

	constructor(message: string) {
		super(message);
		this.name = "BadRequestError";
	}
}

export class InternalServerError extends ErrorResponse {
	status = 500;

	constructor(message: string) {
		super(message);
		this.name = "InternalServerError";
	}
}

export class FeatureNotPurchasedError extends ErrorResponse {
	status = 402;

	constructor(message: string) {
		super(message);
		this.name = "FeatureNotPurchasedError";
	}
}

export class MultipleChoiceFoundError extends ErrorResponse {
	status = 300;

	choices: { label: string; value: string }[];

	constructor(message: string, choices: { label: string; value: string }[]) {
		super(message);
		this.name = "MultipleChoiceFoundError";
		this.choices = choices;
	}

	handleResponse(res: Response): void {
		res.status(this.status).send({ message: this.responseMessage, choices: this.choices });
	}
}

export class ValidationError extends ErrorResponse {
	status = 422;

	constructor(message: string, public errors: Result<ValidationErrorResult>) {
		super(message);
		this.name = "ValidationError";
	}

	handleResponse(res: Response): void {
		res.status(this.status).send({
			message: this.responseMessage,
			errors: this.errors.array(),
		});
	}
}

export class ValidationResultError extends ErrorResponse {
	status = 422;

	constructor(message: string, public errors: ValidationErrorResult[]) {
		super(message);
		this.name = "ValidationError";
	}

	handleResponse(res: Response): void {
		res.status(this.status).send({
			message: this.responseMessage,
			errors: this.errors,
		});
	}
}

export class MongooseValidationError extends ErrorResponse {
	status = 422;

	errors: ValidationErrorResult[];

	constructor(error: mongoose.Error.ValidationError) {
		super(error.message);
		this.name = "MongooseValidationError";
		this.errors = this.convertMongooseError(error.errors);
	}

	convertMongooseError(
		errors: mongoose.Error.ValidationError["errors"]
	): ValidationErrorResult[] {
		return Object.values(errors).map((err) => ({
			msg: err.message,
			param: err.path,
			value: err.value,
			location: "body",
		}));
	}

	handleResponse(res: Response): void {
		return new ValidationResultError(this.message, this.errors).handleResponse(res);
	}
}
