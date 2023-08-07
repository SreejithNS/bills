const { Bill } = require("../../models/BillModel");
const { Customer } = require("../../models/CustomerModel");
const { getAdmin } = require("../../helpers/privilegedAccess");
const { privilegeEnum } = require("../../helpers/privilegeEnum");
const { userData } = require("../AuthController");
const authenticate = require("../../middlewares/jwt");
const express = require("express");
const aqp = require("api-query-params");

/**
 * @typedef {Object} GetBillsParameters
 * @property {string} soldBy
 * @property {Date=} createdAt
 */

class AnalyticsService {
    constructor() {
        this.permissionName = "ANALYTICS";
        this.permissions = {
            "billGet": "ALLOW_BILL_GET_ALL",
            "customersGet": "ALLOW_CUSTOMER_GET",
        };
    }

    /**
     * @param {string} user
     * @param {GetBillsParameters} params
     */
    async getBills(user, params) {
        const belongsTo = await getAdmin(user);

        const result = await Bill.find({
            belongsTo: belongsTo._id,
            ...params.filter,
        }).populate("customer");

        return result;
    }

    /**
     * @param {string} user
     */
    async getCustomers(user) {
        const belongsTo = await getAdmin(user);

        const result = await Customer.find({
            belongsTo: belongsTo._id,
        });

        return result;
    }
}

class AnalyticsController {
    constructor() {
        this.service = new AnalyticsService();
        this.permissions = this.service.permissions;

        this.apiPath = "/analytics";
        this.router = null;

        this.routes = [
            {
                path: "/bills",
                method: "get",
                localMiddlewares: [authenticate],
                action: this.bills.bind(this),
            },
            {
                path: "/customers",
                method: "get",
                localMiddlewares: [authenticate],
                action: this.customers.bind(this),
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

    async bills(req, res) {
        try {
            if (!await this.checkPermission(req, this.service.permissions.billGet)) {
                return res.status(401).send({ message: "Not Authorised to do this action" });
            }

            const query = aqp(req.query, {
                whitelist: ["createdAt", "soldBy"]
            });

            return res.send(await this.service.getBills(req.user, query));
        } catch (error) {
            return res.status(500).send({ message: error.message });
        }
    }
    async customers(req, res) {
        try {
            if (!await this.checkPermission(req, this.service.permissions.customersGet)) {
                return res.status(401).send({ message: "Not Authorised to do this action" });
            }

            return res.send(await this.service.getCustomers(req.user));
        } catch (error) {
            return res.status(500).send({ message: error.message });
        }
    }
}


exports.AnalyticsService = new AnalyticsService();
module.exports = new AnalyticsController();