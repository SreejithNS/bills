/* eslint-disable max-classes-per-file */
import { Response } from "express";

abstract class ResponseError extends Error {
	responseMessage: string;

	constructor(message: string) {
		super(message);
		this.responseMessage = message;
	}

	abstract status: number;

	handleResponse(res: Response): void {
		res.status(this.status).send({ message: this.responseMessage });
	}
}

export class AuthenticationError extends ResponseError {
	status = 401;

	constructor(message: string) {
		super(message);
		this.name = "AuthenticationError";
	}
}

export class AuthorizationError extends ResponseError {
	status = 403;

	constructor(message: string) {
		super(message);
		this.name = "AuthorizationError";
	}
}

export class NotFoundError extends ResponseError {
	status = 404;

	constructor(message: string) {
		super(message);
		this.name = "NotFoundError";
	}
}

export class BadRequestError extends ResponseError {
	status = 400;

	constructor(message: string) {
		super(message);
		this.name = "BadRequestError";
	}
}

export class InternalServerError extends ResponseError {
	status = 500;

	constructor(message: string) {
		super(message);
		this.name = "InternalServerError";
	}
}

export class FeatureNotPurchasedError extends ResponseError {
	status = 402;

	constructor(message: string) {
		super(message);
		this.name = "FeatureNotPurchasedError";
	}
}

export class MultipleChoiceFoundError extends ResponseError {
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

export class ValidationError extends ResponseError {
	status = 422;

	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}
