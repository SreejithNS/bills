var mongoose = require("mongoose");
const Product = require("../ProductModel");
const Customer = require("../CustomerModel.js");
const ProductSchema = require("./ProductSchema");
var Schema = mongoose.Schema;

const BillSchema = new Schema(
	{
		items: [{ type: ProductSchema }],
		customer: { type: Schema.Types.ObjectId, ref: "Customer" },
		discountAmount: { type: Number, default: 0 },
		itemsTotalAmount: { type: Number, default: 0 },
		billAmount: { type: Number, default: 0 },
		soldBy: { type: Schema.Types.ObjectId }
	},
	{ timestamps: true }
);

/**
 * Add item or add quantity (if item exist) an item to the list
 * @param {*} item 
 * @param {*} quantity 
 */
BillSchema.methods.addItem = function (item, quantity) {
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
BillSchema.methods.removeItem = function (id) {
	const length = this.items.length;
	this.items = this.items.filter(
		(item) => {
			return item._id.toString() !== id;
		}
	);
	return length !== this.items.length;
};

/**
 * Explicit updation of Quantity
 * @param {BillItem} item 
 * @param {Number} quantity
 * @returns boolean
 */
BillSchema.methods.updateItemQuantity = function (item, quantity) {
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
BillSchema.methods.reduceItemQuantity = function (id, quantity) {
	const billItem = this.items.find(
		(foundItem) => {
			return foundItem._id.toString() === id;
		}
	);
	if (billItem) {
		billItem.quantity -= (billItem.quantity < quantity) ? billItem.quantity : quantity;
	} else {
		return false;
	}
	return true;
};

/**
 * Sum of rates*quantity of individual items
 * @returns {Number} total
 */
BillSchema.methods.calculateItemsTotalAmount = function () {
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
BillSchema.methods.calculateBillAmount = function () {
	const itemsTotalAmount = this.itemsTotalAmount;
	const discountAmount = this.discountAmount;

	return itemsTotalAmount - discountAmount;
};


// BillSchema.virtual("itemsTotalAmount").get(function () {
// 	return this.calculateItemsTotalAmount();
// });

// BillSchema.virtual("billAmount").get(function () {
// 	return this.calculateBillAmount();
// });


// set discount in amount that converts to percentage
BillSchema.virtual("billAmount").set(function (amount) {
	const itemsTotalAmount = this.itemsTotalAmount;
	this.discountPercentage = parseFloat(((amount / itemsTotalAmount) * 100).toFixed(2));
});

/** 
 *	derive discount percentage from the discount amount
 */
BillSchema.virtual("discountPercentage")
	.get(function () {
		const itemsTotalAmount = this.itemsTotalAmount;
		const discountAmount = this.discountAmount;
		return parseFloat(((discountAmount / itemsTotalAmount) * 100).toFixed(2));
	})
	/**
	 * Set discount in percentage that converts to discountAmount
	 * @param {Number} percentage
	 */
	.set(function (percentage) {
		const itemsTotalAmount = this.itemsTotalAmount;
		this.discountAmount = parseFloat((itemsTotalAmount * (percentage / 100)).toFixed(2));
	});

/**
 * Sanitizes and Parses newBillData from client
 * @param {object} BillDataFromClient
 * @param {string} clientIdString
 * @returns {object} BillSchema ready object
 */
BillSchema.methods.parseClientSideBillData = function (BillDataFromClient) {
	const { customer, items } = BillDataFromClient;
	var populatedItems = [];

	Customer.exists(customer, (err, boolean) => {
		if (err || boolean) throw new Error(err || boolean);
	});

	for (let item in items) {
		Product.findById(item.id, (err, document) => {
			if (err) {
				throw new Error(err);
			} else {
				if (document) {
					document.quantity = item.quantity;
					populatedItems.push(document);
				} else {
					throw new Error(`Item not found:${document._id}`);
				}
			}
		}).lean();
	}

	BillDataFromClient.items = populatedItems;
};

module.exports = BillSchema;
