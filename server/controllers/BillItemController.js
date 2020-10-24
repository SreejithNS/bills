const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { sanitizeBody } = require("express-validator");
const auth = require("../middlewares/jwt");
const _ = require("lodash");
const apiResponse = require("../helpers/apiResponse");
const Product = require("../models/ProductModel");

function ProductData(data) {
    this.id = data._id;
    this.code = data.code;
    this.name = data.name;
    this.weight = data.weight;
    this.weightUnit = data.weightUnit;
    this.quantity = data.quantity;
    this.rate = data.rate;
    this.mrp = data.mrp;
}

/**
 * To delete a bill created by the user.
 * 
 * @param {Mongoose.Schema.Types.ObjectId} billId - ID of the bill to be deleted.
 */
exports.delete = [
    auth,
    (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
        }
        try {
            Product.findById(req.params.id, function (err, foundProduct) {
                if (foundProduct === null) {
                    return apiResponse.notFoundResponse(res, "Product not exists with this id");
                } else {
                    //Check authorized user
                    //delete Product.
                    Product.findByIdAndRemove(req.params.id, function (err) {
                        if (err) {
                            return apiResponse.ErrorResponse(res, err);
                        } else {
                            return apiResponse.successResponse(res, "Product delete Success.");
                        }
                    });

                }
            });
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

/**
 * Create a Product.
 * 
 * @param {string} name - Name of the product.
 * @param {string} code - Unique Code of the product.
 * @param {number} rate - Rate of the product.
 * @param {number} mrp - MRP of the product.
 * @param {number} [weight] - Weight of the product.
 * @param {string} weightUnit - Unit of weight/quantity of the product. For eg. kg, g, pkt, box.
 */
exports.create = [
    auth,
    body("code").escape().isLength().trim().isAlphanumeric().custom((value) => {
        return Product.findOne({ code: value }).then((doc) => {
            if (doc) return Promise.reject("Item with this code already exists.");
        });
    }),
    body("name").escape().isLength().trim(),
    body("rate").escape().trim().isNumeric(),
    body("mrp").escape().trim().isNumeric(),
    body("weight").optional().escape().trim().isNumeric(),
    body("weightUnit").optional().escape().trim().custom((value) => {
        return /\b(?:administrator|editor|contributor|user)\b/.exec(value) ? true : Promise.reject("Please enter weight");
    }),
    sanitizeBody("*").escape(),
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
            } else {
                let newProduct = new Product(
                    _.pickBy({
                        code: req.body.code,
                        name: req.body.name,
                        weight: req.body.weight || undefined,
                        weightUnit: req.body.weight || undefined,
                        rate: req.body.rate,
                        mrp: req.body.mrp,
                    }, _.identity));

                //Save Product.
                newProduct.save(function (err) {
                    if (err) { return apiResponse.ErrorResponse(res, err); }
                    let productData = new ProductData(newProduct);
                    return apiResponse.successResponseWithData(res, "Product add Success.", productData);
                });
            }
        } catch (err) {
            //throw error in json response with status 500.
            return apiResponse.ErrorResponse(res, err);
        }
    }
];


/** 
 * Update any fields of the product
 * 
 * @param {Mongoose.Schema.Types.ObjectId} [id] - ID of the product to be updated.
 */
exports.update = [
    //If I do this do I not need to verify later?
    auth,
    body("code").optional().escape().trim().isAlphanumeric(),
    body("name").optional().escape().trim(),
    body("rate").optional().escape().trim().isNumeric(),
    body("mrp").optional().escape().trim().isNumeric(),
    body("weight").optional().escape().trim().isNumeric(),
    body("weightUnit").optional().escape().trim().isAlphanumeric(),
    function (req, res) {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Product ID", {});
        }
        if (!validationResult(req).isEmpty()) return apiResponse.validationErrorWithData(res, "Validation Error.", validationResult(req).array());

        try {

            //Schema doesn't have phone? 
            //Do we need updatedAt?

            Product.findById(req.params.id).then((product) => {
                if (product !== null) {

                    for (let key of Object.keys(req.body)) {
                        product[key] = req.body[key];
                    }

                    product.save(function (err) {
                        if (err) { return apiResponse.ErrorResponse(res, err); }
                        return apiResponse.successResponseWithData(res, "Product update Success.", JSON.parse(JSON.stringify(new ProductData(product))));
                    });
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

/**
 * Get suggestions for the matching Product CODE.
 * 
 * @param {string} code - Phrase or parts of a product's code
 * @returns {Products[]} products - Array of products that matches the code phrase
 */
exports.getSuggestions = [
    auth,
    param("code").escape().trim(),
    (req, res) => {
        const validation = validationResult(req);
        if (!validation.isEmpty()) return apiResponse.validationErrorWithData(res, "Validation Error", validation.array());

        Product.find({
            code: {
                $regex: new RegExp(`${req.params.code}`)
            }
        }, (err, products) => {
            if (err) return apiResponse.ErrorResponse(res, err);
            if(products.length === 0) return apiResponse.successResponseWithData(res, `No suggestions for ${req.params.code}`, []);
            return apiResponse.successResponseWithData(res, `Products with code ${req.params.code}`, products.map(product => new ProductData(product)));
        }).lean();
    }
];

/**
 * Get a product details by its ID
 * 
 * @param {Mongoose.Schema.Types.ObjectId} id - ID of the product
 */
exports.get = [
    auth,
    function (req, res) {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Product ID", {});
        }
        try {
            Product.findById(req.params.id).then((product) => {
                if (product !== null) {
                    let productData = new ProductData(product);
                        return apiResponse.successResponseWithData(res, "Operation success", productData);
                } else {
                    return apiResponse.successResponseWithData(res, "Operation success: No product Found", {});
                }
            });
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];
