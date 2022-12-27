import * as chalk from "chalk";

export default function logger(...args: unknown[]) {
	if (process.env.NODE_ENV === "production") {
		return;
	}

	console.log(
		...args.map((arg, index) => {
			if (typeof arg === "string") {
				// Bold all numbers and booleans
				const formattedArg = arg.replace(/(true|false|\d+)/g, chalk.bold("$1"));

				if (index === 0) {
					return `${chalk.bgYellow.black.bold(" LOG ")} ${formattedArg}`;
				}

				return formattedArg;
			}
			return arg;
		})
	);
}
