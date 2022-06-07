
const { CheckIn } = require("../../models/CheckInModel");
const geolib = require("geolib");
const { Customer } = require("../../models/CustomerModel");
const { Bill } = require("../../models/BillModel");
const { getAdmin } = require("../../helpers/privilegedAccess");
const aqp = require("api-query-params");
const { userData } = require("../AuthController");
const { privilegeEnum } = require("../../helpers/privilegeEnum");
const apiResponse = require("../../helpers/apiResponse");
const authenticate = require("../../middlewares/jwt");
const express = require("express");

/** @typedef {Object} CheckInDTO
 * @property {string=} _id
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} checkedBy
 * @property {string} belongsTo
 * @property {string|{location:{type:"Point";coordinates:[number,number];};}|null} contact
 * @property {BillItem[]} products
 * @property {number} discountAmount
 * @property {number} billAmount
 * @property {number} itemsTotalAmount
 * @property {{type:"Point";coordinates:[number,number]}} checkInLocation
 * @property {number|null} distance
 * @property {{name:string;label:string;value:string;}[]} dates 
 */

/**
 * @typedef {object} DateField
 * @property {string} name
 * @property {string} label
 * @property {string} value
 */

/**
 * @typedef {object} CheckInSettings
 * @property {boolean} customerRequired
 * @property {boolean} productsRequired
 * @property {boolean} noteRequired
 * @property {string[]} notePresets
 * @property {DateField[]} dateFields
 * 
 */

class CheckInService {
    constructor() {
        this.permissionName = "CHECKIN";
        this.permissions = {
            "create": "ALLOW_" + this.permissionName + "_POST",
            "update": "ALLOW_" + this.permissionName + "_PUT",
            "delete": "ALLOW_" + this.permissionName + "_DELETE",
            "get": "ALLOW_" + this.permissionName + "_GET",
            "getAll": "ALLOW_" + this.permissionName + "_GET_ALL"
        };

        this.populateOptions = [
            { path: "checkedBy", select: "-phone -password -settings -organisation" },
            { path: "belongsTo", select: "-phone -password -settings -organisation" },
            { path: "contact", select: "-belongsTo -phone" },
        ];
    }

    /**
     * Takes in parameters as an object or a document of checkin and validates based on organisation settings. 
     * After validation by default the checkin will be saved to the database.
     * @param {CheckInDTO|CheckIn} params - Parameters of a checkin according to CheckInSchema.
     * @param {boolean} noSave - if true, the checkin will not be saved to the database but will be returned
     */
    async create(params, noSave = false) {
        if (!params.checkedBy) throw new Error("CheckedIn user id missing");

        const admin = await getAdmin(params.checkedBy);

        /**
         * @type {CheckInSettings}
         */
        const settings = admin.organisation.checkInSettings;

        if (settings.customerRequired && !params.contact) throw new Error("Customer is required");
        if (settings.productsRequired && !params.products) throw new Error("Products are required");
        if (settings.noteRequired && !params.note) throw new Error("Note is required");

        params.belongsTo = admin._id;

        if (params.contact) {
            const contact = await Customer.findById(params.contact);
            if (!contact) {
                throw new Error("Invalid contact");
            }

            // check if contact.location is not undefined
            if (contact.location) {
                let target = { latitude: contact.location.coordinates[1], longitude: contact.location.coordinates[0] };
                let checkInLocation = { latitude: params.checkInLocation.coordinates[1], longitude: params.checkInLocation.coordinates[0] };

                params.distance = geolib.getDistance(target, checkInLocation);
            }
        }

        if (params.products && params.products.length > 0) {
            params.products = await Bill.populateItemsWithQuantity(params.products);
        }

        let checkin;

        if (params instanceof CheckIn) {
            checkin = params;
        } else {
            checkin = new CheckIn(params);
        }


        if (params.products && params.products.length > 0) {
            checkin.itemsTotalAmount = checkin.calculateItemsTotalAmount();
            checkin.billAmount = checkin.calculateBillAmount();
        }

        const requiredDates = settings.dateFields.filter(field => field.required);
        if (requiredDates.length > 0) {
            if (checkin.dates) {
                requiredDates.forEach(field => {
                    if (!checkin.dates.find(date => date.name === field.name)) {
                        throw new Error(`${field.label} is required`);
                    }
                });
            } else {
                throw new Error("Dates are required");
            }
        }

        return noSave ? checkin : await checkin.save();
    }

    async read(id) {
        return await CheckIn.findById(id).populate(this.populateOptions);
    }

    async get(query, belongsTo, checkedBy, page = 1) {
        const { filter, limit = 10, sort = "", projection = "" } = aqp(query, {
            blacklist: ["belongsTo"]
        });

        return await CheckIn.paginate({ ...filter, belongsTo }, {
            limit,
            sort,
            projection,
            populate: this.populateOptions,
            page
        });
    }

    async update(id, params) {
        const checkin = await this.read(id);

        if (!checkin) throw new Error("Checkin not found");

        return await this.create(params);
    }

    async delete(id) {
        const checkin = await this.read(id);

        if (!checkin) throw new Error("Checkin not found");

        return await checkin.remove();
    }
}

class CheckInController {
    constructor() {
        this.service = new CheckInService();
        this.permissions = this.service.permissions;

        this.apiPath = "/checkin";
        this.router = null;
        this.routes = [
            {
                path: "/",
                method: "post",
                localMiddlewares: [authenticate],
                action: this.create.bind(this),
            },
            {
                path: "/:id",
                method: "get",
                localMiddlewares: [authenticate],
                action: this.read.bind(this),
            },
            {
                path: "/",
                method: "get",
                localMiddlewares: [authenticate],
                action: this.get.bind(this),
            },
            {
                path: "/:id",
                method: "put",
                localMiddlewares: [authenticate],
                action: this.update.bind(this),
            },
            {
                path: "/:id",
                method: "delete",
                localMiddlewares: [authenticate],
                action: this.delete.bind(this),
            },
        ];
    }

    /**
     * @param {ReturnType<typeof import("express").Router>} router 
     */
    attach(router) {
        this.routes.forEach(route => {
            router[route.method](route.path, ...route.localMiddlewares, route.action);
        });
    }

    getRouter() {
        if (!this.router) {
            this.router = express.Router();
            this.attach(this.router);
        }
        return this.router;
    }

    async checkPermission(req, permission) {
        req.user = await userData(req.user._id);
        req.admin = await getAdmin(req.user._id);

        if (req.user.type === privilegeEnum.admin) {
            return true;
        } else {
            return req.user.settings.permissions.includes(permission);
        }
    }

    async create(req, res) {
        try {
            if (await this.checkPermission(req, this.permissions.create)) {

                const checkin = await this.service.create({ ...req.body, checkedBy: req.user._id });

                return apiResponse.successResponseWithData(res, "Checkin created successfully", checkin, true);
            } else {
                return apiResponse.unauthorizedResponse(res);
            }
        } catch (error) {
            return apiResponse.ErrorResponse(res, error);
        }
    }

    async read(req, res) {
        try {
            if (await this.checkPermission(req, this.permissions.get)) {
                const checkin = await this.service.read(req.params.id);

                return apiResponse.successResponseWithData(res, "Checkin found successfully", checkin);
            } else {
                return apiResponse.unauthorizedResponse(res);
            }
        } catch (error) {
            return apiResponse.ErrorResponse(res, error);
        }
    }

    async get(req, res) {
        try {
            if (await this.checkPermission(req, this.permissions.getAll)) {
                const checkins = await this.service.get(req.query, req.admin._id.toString(), req.query.checkedBy, req.query.page);

                return apiResponse.successResponseWithData(res, "Checkins retreived successfully", checkins);
            } else if (await this.checkPermission(req, this.permissions.get)) {
                const checkins = await this.service.get(req.query, req.admin._id.toString(), req.user._id.toString(), req.query.page);

                return apiResponse.successResponseWithData(res, "Checkins retreived successfully", checkins);
            } else {
                return apiResponse.unauthorizedResponse(res);
            }
        } catch (error) {
            return apiResponse.ErrorResponse(res, error);
        }
    }

    async update(req, res) {
        try {
            if (await this.checkPermission(req, this.permissions.update)) {
                const checkin = await this.service.update(req.params.id, req.body);

                return apiResponse.successResponseWithData(res, "Checkin updated successfully", checkin);
            } else {
                return apiResponse.unauthorizedResponse(res);
            }
        } catch (error) {
            return apiResponse.ErrorResponse(res, error);
        }
    }

    async delete(req, res) {
        try {
            if (await this.checkPermission(req, this.permissions.delete)) {
                await this.service.delete(req.params.id);

                return apiResponse.successResponse(res, "Checkin deleted successfully");
            } else {
                return apiResponse.unauthorizedResponse(res);
            }
        } catch (error) {
            return apiResponse.ErrorResponse(res, error);
        }
    }
}

exports.CheckInService = new CheckInService();
module.exports = new CheckInController();