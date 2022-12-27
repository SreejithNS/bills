import aqp, { AqpQuery } from "api-query-params";
import { PaginateOptions, FilterQuery } from "mongoose";
import { ValidationError as ValidationErrorResult } from "express-validator";
import { PaginationParameters } from "mongoose-paginate-v2";
import { ValidationResultError } from "./Errors";

type AQPRequestQuery = Parameters<typeof aqp>[0];
type AQPOptions = Parameters<typeof aqp>[1];

interface PaginationOptionsWithCompulsoryKeys<ModelInterface> extends PaginateOptions {
	compulsoryKeys?: Extract<keyof ModelInterface, string>[];
}

export default class Pagination<ModelInterface> {
	private options: AQPOptions & PaginationOptionsWithCompulsoryKeys<ModelInterface> = {
		filterKey: "query",
	};

	constructor(
		options?: Pick<AQPOptions, "blacklist" | "whitelist"> &
			PaginationOptionsWithCompulsoryKeys<ModelInterface>
	) {
		if (options) {
			this.options = {
				options,
				...this.options,
			};
		}
	}

	public getQuery(requestQuery: AQPRequestQuery, compulsoryFilter?: FilterQuery<ModelInterface>) {
		const parseQuery: AqpQuery = aqp(requestQuery, this.options);

		parseQuery.filter = {
			...parseQuery.filter,
			...compulsoryFilter,
		};

		if (this.options.compulsoryKeys) {
			const validationErrors: ValidationErrorResult[] = [];
			this.options.compulsoryKeys.forEach((key) => {
				if (!parseQuery.filter[key]) {
					validationErrors.push({
						param: key,
						msg: `Missing compulsory key: ${key}`,
						value: parseQuery.filter[key],
						location: "query",
					});
				}
			});

			if (validationErrors.length > 0) {
				throw new ValidationResultError(
					"Missing compulsory query parameters",
					validationErrors
				);
			}
		}

		const { filter: query, limit, population, projection, skip, sort } = parseQuery;
		
		return new PaginationParameters({
			query: {
				query,
				limit,
				populate: population,
				select: projection,
				skip,
				sort,
			},
		});
	}
}
