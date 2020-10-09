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