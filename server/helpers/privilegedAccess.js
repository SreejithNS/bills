const apiResponse = require("./apiResponse");
const privilegeEnum = require("./privilegeEnum");

exports.isPrivilegedAs = (checkFor) => (req, res, next) => {
    if (req.user.type === checkFor) {
        return next();
    } else {
        return apiResponse.unauthorizedResponse(res, "You don't have the privilege to access this endpoint");
    }
};

module.isAdmin = (req, res, next) => {
    if(req.user.type !== privilegeEnum.admin){
       return apiResponse.unauthorizedResponse(res,"You are not authorised");
    }
    return next();
};