const apiResponse = require("./apiResponse");
const { privilegeEnum } = require("./privilegeEnum");
const mongoose = require("mongoose");
const { User } = require("../models/UserModel");

/**
 * @param {privilegeEnum|privilegeEnum[]} checkFor 
 * @returns Middleware function
 */
exports.onlyFor = (checkFor) => (req, res, next) => {
    if (Array.isArray(checkFor)) {
        for (let i = 0; i < checkFor.length; i++) {
            if (req.user.type === checkFor[i]) return next();
        }
        return apiResponse.unauthorizedResponse(res, "You don't have the privilege to access this endpoint");
    } else {
        if (req.user.type === checkFor) {
            return next();
        } else {
            return apiResponse.unauthorizedResponse(res, "You don't have the privilege to access this endpoint");
        }
    }
};

module.onlyAdmins = (req, res, next) => {
    return exports.onlyFor(privilegeEnum.admin)(req, res, next);
};

/**
 * Recursively fetch the admin of the user.
 * @param {string|mongoose.Types.ObjectId|User} identity - User's id or document
 * @returns {import("mongoose").Document} Admin of the user
 */
async function getAdmin(identity) {
    if (typeof identity === "string" || mongoose.Types.ObjectId.isValid(identity)) {
        const admin = await User.findById(identity);
        if (!admin) throw new Error("Invalid User");

        if (admin.type === privilegeEnum.admin) {
            return admin;
        } else {
            return await getAdmin(admin.belongsTo);
        }
    } else if ("type" in identity) {
        if (identity.type === privilegeEnum.admin) {
            return identity;
        } else {
            if (!identity.populated("belongsTo")) await identity.populate("belongsTo");
            return await getAdmin(identity.belongsTo);
        }
    }
}

exports.getAdmin = getAdmin;
