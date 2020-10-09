const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const auth = require("../middlewares/jwt");
const onlyAdmin = require("../middlewares/onlyAdmin");
const apiResponse = require("../helpers/apiResponse");
const Product = require("../models/ProductModel");

/*TODO:
    Create,
    delete,
    get(code),
    update
*/
exports.delete = [
    auth,
    function (req, res) {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
        }
        try {
            Product.findById(req.params.id, function (err, foundProduct) {
                if (foundProduct === null) {
                    return apiResponse.notFoundResponse(res, "Product not exists with this id");
                } else {
                    //Check authorized user
                    if (foundProduct.createdBy.toString() === req.user._id || req.user.type === privilegeEnum.admin) {
                        //delete Product.
                        Product.findByIdAndRemove(req.params.id, function (err) {
                            if (err) {
                                return apiResponse.ErrorResponse(res, err);
                            } else {
                                return apiResponse.successResponse(res, "Book delete Success.");
                            }
                        });
                    }else return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
                    
                }
            });
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];


module.exports = [
    auth,
    body("code").escape().isLength().trim().isAlphanumeric().custom((value)=>{
        return Product.findOne({code:value}).then((doc)=>{
            if(doc) return Promise.reject("Item with this code already exists.");
        });
    }),
    body("name").optional().escape().isLength().trim().isAlphanumeric(),
    body("rate").optional().escape().trim().isNumeric(),
    body("mrp").optional().escape().trim().isNumeric(),
    body("weight").optional().escape().trim().isNumeric(),
    body("weightUnit").optional().escape().trim().custom((value)=>{
        return /\b(?:administrator|editor|contributor|user)\b/.exec(value)?true:Promise.reject("Please enter weight");
    }),
];