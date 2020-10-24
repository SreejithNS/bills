const Customer = require("../models/CustomerModel");
const { body,param, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
const privilegeEnum = require("../helpers/privilegeEnum");
mongoose.set("useFindAndModify", false);
const _ = require("lodash");

// Customer Schema
function CustomerData(data) {
    this.id = data._id;
    this.name = data.name;
    this.place = data.place;
    this.phone = data.phone;
    this.location = data.location;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
}

/**
 * Get all Customers Created by user.
 * If user is admin returns all Customers.
 * 
 * @returns {Object}
 */
exports.getAll = [
    //FIXME: Wrong authorisations and privilage handling.
    auth,
    function (req, res) {
        try {
            if (req.user.type == privilegeEnum.admin)
                Customer.find({ createdBy: req.user._id }, "_id name phone").then((customers) => {
                    if (customers.length > 0) {
                        return apiResponse.successResponseWithData(res, "Operation success", customers);
                    } else {
                        return apiResponse.successResponseWithData(res, "Operation success", []);
                    }
                });
            else Customer.find({}, "_id name").then((customers) => {
                if (customers.length > 0) {
                    return apiResponse.successResponseWithData(res, "Operation success", customers);
                } else {
                    return apiResponse.successResponseWithData(res, "Operation success", []);
                }
            });
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

/**
 * Customer Detail.
 * 
 * If the user is not admin or not the one who created the customer will get only name
 * @param {string} id
 * 
 * @returns {Object}
 */
exports.get = [
    auth,
    function (req, res) {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Customer ID", {});
        }
        try {
            Customer.findById(req.params.id, "_id name place location createdBy createdAt").then((customer) => {
                if (customer !== null) {
                    let customerData = new CustomerData(customer);
                    if (customer.createdBy === req.user._id || req.user.type === privilegeEnum.admin)
                        return apiResponse.successResponseWithData(res, "Operation success", customerData);
                    else
                        return apiResponse.successResponseWithData(res, "Operation success", _.pick(customerData, ["name"]));
                } else {
                    return apiResponse.successResponseWithData(res, "Operation success: No Customer Found", {});
                }
            });
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

/**

 * Create a customer.
 * 
 * @param {string}      [name]
 * @param {string=}      [place]
 * @param {string=}      [coordinates]
 * 
 * @returns {Object} 
 */
exports.create = [
    auth,
    body("name", "Name must not be empty.").isLength({ min: 1 }).trim(),
    body("phone", "Phone Number must not be empty").trim().escape().isNumeric(),
    body("place").optional().trim(),
    body("coordinates", "Invalid coordinates").optional().custom(({ lat, lon }) => {
        const reg = /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}/;
        return reg.exec(lat) && reg.exec(lon);
    }),
    sanitizeBody("*").escape(),
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
            } else {
                let newCustomer = new Customer(
                    _.pickBy({
                        name: req.body.name,
                        phone:req.body.phone,
                        place: req.body.place || undefined,
                        location: req.body.coordinates ? {
                            type: "Point",
                            coordinates: [req.body.coordinates.lat, req.body.coordinates.lat].map(parseFloat)
                        } : undefined,
                        createdBy: req.user._id
                    }, _.identity));

                //Save Customer.
                newCustomer.save(function (err) {
                    if (err) { return apiResponse.ErrorResponse(res, err); }
                    let customerData = new CustomerData(newCustomer);
                    return apiResponse.successResponseWithData(res, "Customer add Success.", customerData);
                });
            }
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

/** 
 * Customer update.
 * 
 * @returns {Object}
 *
exports.bookUpdate = [
    auth,
    body("title", "Title must not be empty.").isLength({ min: 1 }).trim(),
    body("description", "Description must not be empty.").isLength({ min: 1 }).trim(),
    body("isbn", "ISBN must not be empty").isLength({ min: 1 }).trim().custom((value, { req }) => {
        return Book.findOne({ isbn: value, user: req.user._id, _id: { "$ne": req.params.id } }).then(book => {
            if (book) {
                return Promise.reject("Book already exist with this ISBN no.");
            }
        });
    }),
    sanitizeBody("*").escape(),
    (req, res) => {
        try {
            const errors = validationResult(req);
            var book = new Book(
                {
                    title: req.body.title,
                    description: req.body.description,
                    isbn: req.body.isbn,
                    _id: req.params.id
                });

            if (!errors.isEmpty()) {
                return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
            }
            else {
                if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                    return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
                } else {
                    Book.findById(req.params.id, function (err, foundBook) {
                        if (foundBook === null) {
                            return apiResponse.notFoundResponse(res, "Book not exists with this id");
                        } else {
                            //Check authorized user
                            if (foundBook.user.toString() !== req.user._id) {
                                return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
                            } else {
                                //update book.
                                Book.findByIdAndUpdate(req.params.id, book, {}, function (err) {
                                    if (err) {
                                        return apiResponse.ErrorResponse(res, err);
                                    } else {
                                        let bookData = new BookData(book);
                                        return apiResponse.successResponseWithData(res, "Book update Success.", bookData);
                                    }
                                });
                            }
                        }
                    });
                }
            }
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];
//

/** 
 * Customer Delete.
 * 
 * @param {string}     [id] 
 * 
 * @returns {Object}
 */

exports.delete = [
    auth,
    function (req, res) {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
        }
        try {
            Customer.findById(req.params.id, function (err, foundCustomer) {
                if (foundCustomer === null) {
                    return apiResponse.notFoundResponse(res, "Customer not exists with this id");
                } else {
                    //Check authorized user
                        //delete Customer.
                        Customer.findByIdAndRemove(req.params.id, function (err) {
                            if (err) {
                                return apiResponse.ErrorResponse(res, err);
                            } else {
                                return apiResponse.successResponse(res, "Customer delete Success.");
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
 * Customer update.
 * 
 * @returns {Object}
 */

exports.update = [
    auth,
    function (req, res) {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Customre ID", {});
        }
        if (!validationResult(req).isEmpty()) return apiResponse.validationErrorWithData(res, "Validation Error.", validationResult(req).array());

        try {
            Customer.findById(req.params.id).then((customer) => {
                if (customer !== null) {

                    for (let key of Object.keys(req.body)) {
                        customer[key] = req.body[key];
                    }
                    customer.save(function (err) {
                        if (err) { return apiResponse.ErrorResponse(res, err); }
                        return apiResponse.successResponseWithData(res, "Customer update Success.", JSON.parse(JSON.stringify(new CustomerData(customer))));
                    });
                } else {
                    return apiResponse.successResponseWithData(res, "Operation success: No Customer Found", {});
                }
            });
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

exports.getSuggestions = [
    auth,
    param("name").escape().trim(),
    (req, res) => {
        const validation = validationResult(req);
        if (!validation.isEmpty()) return apiResponse.validationErrorWithData(res, "Validation Error", validation.array());

        Customer.find({
            name: {
                $regex: new RegExp(`${req.params.name}`)
            }
        }, (err, customers) => {
            if (err) return apiResponse.ErrorResponse(res, err);
            if(customers.length === 0) return apiResponse.successResponseWithData(res, `No suggestions for ${req.params.name}`, []);
            return apiResponse.successResponseWithData(res, `Customers with name: ${req.params.name}`, customers.map(customer => new CustomerData(customer)));
        }).lean();
    }
];