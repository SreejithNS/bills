module.exports = function (rate, mrp, units, cost = 0) {
	if (!units || !Array.isArray(units))
		throw new TypeError("Unit is not an array");
	for (let unit of units) {
		if (!Object.keys(unit).includes("name"))
			throw new TypeError("Unit doesn't have a name");
		else if (
			!(typeof unit.name === "string" || unit.name instanceof String)
		)
			throw new TypeError("Unit name is not a string");

		unit["name"] = unit["name"].trim().toLowerCase();

		if (!Object.keys(unit).includes("conversion")) unit["conversion"] = 1;
		if (!Object.keys(unit).includes("rate")) unit["rate"] = rate * unit["conversion"];
		if (!Object.keys(unit).includes("mrp")) unit["mrp"] = mrp * unit["conversion"];
		if (!Object.keys(unit).includes("cost")) unit["cost"] = cost * unit["conversion"];
	}
	return units;
};
