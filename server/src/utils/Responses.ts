/* eslint-disable max-classes-per-file */
import { Response as EResponse } from "express";

abstract class Response {
	// eslint-disable-next-line no-useless-constructor
	constructor(protected response: EResponse, public status: number, public message: string) {}

	respond() {
		this.response.status(this.status).json({
			message: this.message,
		});
	}
}

abstract class DataResponse extends Response {
	constructor(response: EResponse, status: number, message: string, public data: unknown) {
		super(response, status, message);
	}

	respond() {
		this.response.status(this.status).json({
			message: this.message,
			data: this.data,
		});
	}
}

export class SuccessResponse extends Response {
	constructor(response: EResponse, message: string) {
		super(response, 200, message);
	}

	respond() {
		this.response.status(this.status).json({
			message: this.message,
		});
	}
}

export class SuccessResponseWithData extends DataResponse {
    constructor(response: EResponse, message: string, data: unknown) {
        super(response, 200, message, data);
    }
}


export class ReadResponse extends DataResponse {
	constructor(response: EResponse, message: string, public data: unknown) {
		super(response, 200, message, data);
	}
}

export class CreateResponse extends DataResponse {
	constructor(response: EResponse, message: string, public data: unknown) {
		super(response, 201, message, data);
	}
}

export class UpdateResponse extends DataResponse {
    constructor(response: EResponse, message: string, public data: unknown) {
        super(response, 200, message, data);
    }
}

export class DeleteResponse extends Response {
    constructor(response: EResponse, message: string) {
        super(response, 200, message);
    }
}
