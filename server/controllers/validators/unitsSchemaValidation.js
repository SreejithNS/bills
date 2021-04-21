module.exports = function (rate, mrp, units) {
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

		if (!Object.keys(unit).includes("rate")) unit["rate"] = rate;
		if (!Object.keys(unit).includes("mrp")) unit["mrp"] = mrp;
	}
	return units;
};
