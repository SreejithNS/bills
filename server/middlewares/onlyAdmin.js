const privilegeEnum = require("../helpers/privilegeEnum")
const apiResponse = require("../helpers/apiResponse");


module.exports = (req, res, next) => {
    if(req.user.type !== privilegeEnum.admin){
        apiResponse.unauthorizedResponse(res,"You are not authorised");
    }
    next();
}