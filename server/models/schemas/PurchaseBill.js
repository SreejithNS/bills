var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { Product } = require("../ProductModel");
var Schema = mongoose.Schema;
const Payment = require("./PaymentSchema");

const AutoIncrement = require("mongoose-sequence")(mongoose);

const PurchaseBillSchema = new Schema(
    {
        serialNumber: { //Incremental Serial Number Right from 0
            type: Number,
            index: true,
        },
        items: [
            {
                code: { type: String, required: true },
                name: { type: String, required: true },
                unit: { type: String },
                conversion: { type: Number, default: 1 },
                category: { type: String },
                cost: { type: Number, required: true },
                quantity: { type: Number, required: true },
                rate: { type: Number, default: 0 },
                mrp: { type: Number, default: 0 },
                instock: { type: Number, default: 0 }
            },
        ],
        contact: { type: Schema.Types.ObjectId, ref: "Customer" },
        itemsTotalAmount: { type: Number, default: 0 },
        billAmount: { type: Number, default: 0 },
        purchasedBy: { type: Schema.Types.ObjectId, ref: "User" },
        credit: { type: Boolean, default: true },
        paidAmount: { type: Number, default: 0 },
        belongsTo: { type: Schema.Types.ObjectId, ref: "User" },
        payments: {
            type: [
                {
                    type: Payment,
                },
            ],
            default: [],
        },
        sales: [
            {
                bill: { type: Schema.Types.ObjectId, ref: "Bill", required: true },
                items: [
                    {
                        code: { type: String, required: true },
                        unit: { type: String, required: true },
                        quantity: { type: Number, required: true },
                        amount: { type: Number, required: true }
                    }
                ]
            }
        ]
    },
    { timestamps: true }
);

/**
 * Add item or add quantity (if item exist) an item to the list
 * @param {*} item
 * @param {*} quantity
 */
PurchaseBillSchema.methods.addItem = function (item, quantity) {
    const billItem = this.items.find(
        (foundItem) => foundItem._id.toString() === item._id.toString()
    );
    if (billItem) {
        billItem.quantity += quantity;
    } else {
        const newItem = { ...item, quantity };
        this.items.push(newItem);
    }
    return this.items.length;
};

/**
 * Remove item by its id
 * @param {Number} id
 * @returns boolean
 */
PurchaseBillSchema.methods.removeItem = function (id) {
    const length = this.items.length;
    this.items = this.items.filter((item) => {
        return item._id.toString() !== id;
    });
    return length !== this.items.length;
};

/**
 * Explicit updation of Quantity
 * @param {BillItem} item
 * @param {Number} quantity
 * @returns boolean
 */
PurchaseBillSchema.methods.updateItemQuantity = function (item, quantity) {
    const billItem = this.items.find(
        (foundItem) => foundItem._id.toString() === item._id.toString()
    );
    if (billItem) {
        billItem.quantity = quantity;
        if (billItem.quantity <= 0) {
            return this.removeItem(item._id.toString());
        }
    } else {
        return false;
    }
    return true;
};

/**
 * Reduce item quantity by id
 * @param {String} id
 * @param {Number} quantity
 * @returns boolean
 */
PurchaseBillSchema.methods.reduceItemQuantity = function (id, quantity) {
    const billItem = this.items.find((foundItem) => {
        return foundItem._id.toString() === id;
    });
    if (billItem) {
        billItem.quantity -=
            billItem.quantity < quantity ? billItem.quantity : quantity;
    } else {
        return false;
    }
    return true;
};

/**
 * Sum of rates*quantity of individual items
 * @returns {Number} total
 */
PurchaseBillSchema.methods.calculateItemsTotalAmount = function () {
    let total = 0;

    this.items.forEach((item) => {
        total += item.quantity * item.rate;
    });

    return total;
};

/**
 * Calculate itemsTotalAmount - discountAmount
 * @returns {Number} bill amount
 */
PurchaseBillSchema.methods.calculateBillAmount = function () {
    const itemsTotalAmount = this.itemsTotalAmount;
    const discountAmount = this.discountAmount;

    return Math.round(itemsTotalAmount - discountAmount);
};

// PurchaseBillSchema.virtual("itemsTotalAmount").get(function () {
// 	return this.calculateItemsTotalAmount();
// });

// PurchaseBillSchema.virtual("billAmount").get(function () {
// 	return this.calculateBillAmount();
// });

// set discount in amount that converts to percentage
// PurchaseBillSchema.virtual("discountAmount").set(function (amount) {
// 	const itemsTotalAmount = this.itemsTotalAmount;
// 	this.discountPercentage = parseFloat(((amount / itemsTotalAmount) * 100).toFixed(2));
// });

/**
 *	derive discount percentage from the discount amount
 */
PurchaseBillSchema.virtual("discountPercentage")
    .get(function () {
        const itemsTotalAmount = this.itemsTotalAmount;
        const discountAmount = this.discountAmount;
        return parseFloat(
            ((discountAmount / itemsTotalAmount) * 100).toFixed(2)
        );
    })
    /**
     * Set discount in percentage that converts to discountAmount
     * @param {Number} percentage
     */
    .set(function (percentage) {
        const itemsTotalAmount = this.itemsTotalAmount;
        this.discountAmount = parseFloat(
            (itemsTotalAmount * (percentage / 100)).toFixed(2)
        );
    });

/**
 * Sanitizes and Parses newBillData from client
 * @param {object} BillDataFromClient
 * @param {string} clientIdString
 * @returns {object} PurchaseBillSchema ready object
 */
PurchaseBillSchema.statics.populateItemsWithQuantity = async function (items) {
    var populatedItems = [];

    for (let item of items) {
        const document = await Product.findOne({ _id: item._id }).lean().exec();
        if (document) {
            document.quantity = item.quantity;
            if (item.unit) {
                const unit = document.units.find(unit => unit.name === item.unit);
                if (unit) {
                    document.unit = unit.name;
                    document.mrp = unit.mrp;
                    document.rate = unit.rate;
                    if (unit.cost) document.cost = unit.cost; else throw new Error("Product has no cost price");
                    if (unit.conversion) document.conversion = unit.conversion; else throw new Error("Product has no cost price");
                    if (unit.converted) document.converted = document.quantity * unit.converted;
                }
            } else {
                document.unit = document.primaryUnit;
            }
            populatedItems.push(document);
        } else {
            // apiResponse.ErrorResponse(res,`Product not found:${item.id}`);
            throw new Error(`Product not found:${item.id}`);
        }
    }
    return populatedItems;
};

PurchaseBillSchema.plugin(mongoosePaginate);
PurchaseBillSchema.index({ serialNumber: 1, belongsTo: 1 }, { unique: true });
PurchaseBillSchema.plugin(AutoIncrement,
    {
        id: "purchase_bill_sequence",
        inc_field: "serialNumber",
        reference_fields: ["belongsTo"],
        start_seq: 1
    }
);

module.exports = PurchaseBillSchema;
