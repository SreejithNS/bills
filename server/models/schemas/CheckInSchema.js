const LocationSchema = require("./LocationSchema");
var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var Schema = mongoose.Schema;
const { User } = require("../UserModel");
const { Customer } = require("../CustomerModel");

const userExists = async function userExists(id, role = "User") {
    const user = await User.findById(id);
    if (!user) {
        throw new Error(role + " not found");
    }
    return true;
};

const contactExists = async function userExists(id, role = "Contact") {
    const user = await Customer.findById(id);
    if (!user) {
        throw new Error(role + " not found");
    }
    return true;
};

const CheckInSchema = new Schema(
    {
        // User & Organization
        checkedBy: {
            type: Schema.Types.ObjectId, ref: "User", required: true,
            validate: {
                validator: async (id) => await userExists(id)
            },
            index: true,
        },
        belongsTo: {
            type: Schema.Types.ObjectId, ref: "User", required: true,
            validate: {
                validator: async (id) => await userExists(id, "Admin")
            },
            index: true
        },
        // Contact
        contact: {
            type: Schema.Types.ObjectId, ref: "Customer",
            validate: {
                validator: async (id) => id ? await contactExists(id) : true
            },
            default: null,
            index: true
        },
        // Products and its values
        products: {
            type: [
                {
                    code: { type: String, required: true },
                    name: { type: String, required: true },
                    unit: { type: String },
                    category: { type: String },
                    quantity: { type: Number, required: true },
                    rate: { type: Number, default: 0 },
                    mrp: { type: Number, default: 0 },
                    converted: { type: Number, default: 1 },
                    cost: { type: Number, default: 0 },
                    stocked: { type: Boolean, default: false },
                },
            ],
            default: [],
        },
        discountAmount: { type: Number, default: 0 },
        itemsTotalAmount: { type: Number, default: 0 },
        billAmount: { type: Number, default: 0 },
        // Note
        note: { type: String, default: null },
        // Location
        checkInLocation: {
            type: LocationSchema,
            required: true
        },
        distance: {
            type: Number,
            default: null
        },
        dates: {
            type: [{
                name: { type: String, required: true },
                label: { type: String, required: true },
                value: { type: Date, required: true },
            }],
            default: []
        }
    },
    { timestamps: true }
);

////////// Product Value Calculations //////////

/**
 * Sum of rates*quantity of individual items
 * @returns {Number} total
 */
CheckInSchema.methods.calculateItemsTotalAmount = function () {
    let total = 0;

    this.products.forEach((item) => {
        total += item.quantity * item.rate;
    });

    return total;
};

/**
 * Calculate itemsTotalAmount - discountAmount
 * @returns {Number} bill amount
 */
CheckInSchema.methods.calculateBillAmount = function () {
    const itemsTotalAmount = this.itemsTotalAmount;
    const discountAmount = this.discountAmount;

    return Math.round(itemsTotalAmount - discountAmount);
};

////////// Plugins //////////

CheckInSchema.plugin(mongoosePaginate);

module.exports = CheckInSchema;