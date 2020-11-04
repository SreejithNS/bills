const jwt = require("express-jwt");
const secret = process.env.JWT_SECRET;

const authenticate = jwt({
	secret: secret,
	getToken: (req) => {
		if (req.cookies.token) return req.cookies.token;
		//Get from cookie token
		else if (req.body.token) return req.body.token;
		// or from {token:"xyz"}
		else if (
			req.headers.authorization &&
			req.headers.authorization.split(" ")[0] === "Bearer"
		) {
			return req.headers.authorization.split(" ")[1]; // or from header {Authorization : Bearer xyz}
		} else if (req.query && req.query.token) {
			return req.query.token; // or from query { token=xyz }
		}
		return null;
	},
}).unless({ path: [/login\/.*/gm, "/login"] });

module.exports = authenticate;
