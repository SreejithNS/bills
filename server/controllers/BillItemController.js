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

//TODO: Create a product from code,name,rate,mrp.  
exports.create = [
    auth,
    body("code").escape().isLength().trim().isAlphanumeric().custom((value)=>{
        return Product.findOne({code:value}).then((doc)=>{
            if(doc) return Promise.reject("Item with this code already exists.");
        });
    }),
    body("name").escape().isLength().trim().isAlphanumeric(),
    body("rate").escape().trim().isNumeric(),
    body("mrp").escape().trim().isNumeric(),
    body("weight").optional().escape().trim().isNumeric(),
    body("weightUnit").optional().escape().trim().custom((value)=>{
        return /\b(?:administrator|editor|contributor|user)\b/.exec(value)?true:Promise.reject("Please enter weight");

    }),
    sanitizeBody("*").escape(),
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
            } else {
                let newProduct= new Product(
                    _.pickBy({
                        code: req.body.code,
                        name: req.body.name,
                        weight: req.body.weight,
                        weightUnit: req.body.weight,
                        rate: req.body.rate,
                        mrp: req.body.mrp,
                    }, _.identity));

                //Save Product.
                newProduct.save(function (err) {
                    if (err) { return apiResponse.ErrorResponse(res, err); }
                    let ProductData = new ProductData(newProduct);
                    return apiResponse.successResponseWithData(res, "Product add Success.", ProductData);
                });
            }
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

/** 
 * Product update.
 * 
 * @returns {Object}
 */

exports.update = [
    //If I do this do I not need to verify later?
    auth,
    body("name").escape().isLength().trim().isAlphanumeric(),
    body("rate").escape().trim().isNumeric(),
    body("mrp").escape().trim().isNumeric(),
    body("weight").optional().escape().trim().isNumeric(),
    function (req, res) {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Product ID", {});
        }
        try {
            //Schema doesn't have phone? 
            //Do we need updatedAt?
         
            Product.findById(req.params.id, "_id name phone place location createdBy createdAt").then((Product) => {
                if (Product !== null) {
                    if  (req.body.code)
                        //I dunno how to use validation here
                        if (req.body.code)
                            product.code = req.body.code;
                    if  (req.body.name)
                        //do validation here too
                        if (req.body.name)
                            product.name = req.body.name;
                    if  (req.body.rate)
                        if (req.body.rate)//validation not done
                            product.rate = req.body.rate;

                    if  (req.body.mrp)
                        if (req.body.mrp)//validation not done
                            product.mrp = req.body.mrp;

                   if (req.body.weight)
                        if (req.body.weight)//validation not done
                            product.weight = req.body.weight;

                   if  (req.body.weightUnit)
                        if (req.body.weightUnit)//validation not done
                            product.weightUnit = req.body.weightUnit;

                    if  (req.body.quantity)
                        if (req.body.quantity)//validation not done
                            product.quantity = req.body.quantity;

                    let productData = new ProductData(product);
                    product.save(function (err) {
                        if (err) { return apiResponse.ErrorResponse(res, err); }
                        return apiResponse.successResponseWithData(res, "Product update Success.", productData);
                    });
                    if (Product.createdBy === req.user._id || req.user.type === privilegeEnum.admin)
                        return apiResponse.successResponseWithData(res, "Operation success", productData);
                    else
                        return apiResponse.successResponseWithData(res, "Operation success", _.pick(productData, ["name"]));
                } else {
                    return apiResponse.successResponseWithData(res, "Operation success: No Product Found", {});
                }
            });
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];
