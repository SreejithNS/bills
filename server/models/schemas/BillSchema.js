var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { Product } = require("../ProductModel");
var Schema = mongoose.Schema;
const Payment = require("./PaymentSchema");
const { PurchaseBill } = require("../PurchaseBillModel");
const LocationSchema = require("./LocationSchema");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const BillSchema = new Schema(
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
				category: { type: String },
				quantity: { type: Number, required: true },
				rate: { type: Number, default: 0 },
				mrp: { type: Number, default: 0 },
				converted: { type: Number, default: 1 },
				cost: { type: Number, default: 0 },
				stocked: { type: Boolean, default: false },
			},
		],
		customer: { type: Schema.Types.ObjectId, ref: "Customer" },
		discountAmount: { type: Number, default: 0 },
		itemsTotalAmount: { type: Number, default: 0 },
		billAmount: { type: Number, default: 0 },
		soldBy: { type: Schema.Types.ObjectId, ref: "User" },
		credit: { type: Boolean, default: true },
		paidAmount: { type: Number, default: 0 },
		belongsTo: { type: Schema.Types.ObjectId, ref: "User" },
		location: {
			type: LocationSchema,
			required: false
		},
		payments: {
			type: [
				{
					type: Payment,
				},
			],
			default: [],
		},
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

	return Math.round(itemsTotalAmount - discountAmount);
};

/**
 * Reduce stock of items before saving new bill
 */
BillSchema.pre("save", async function (next) {
	const bill = this;
	const items = bill.items;
	try {
		const session = await mongoose.startSession();
		await session.startTransaction();
		for (let item of items) {
			if (!item.stocked) continue;
			//find the most old purchase bill that has this product
			var soldQuantity = item.converted;
			//new mongoose transaction
			try {
				while (soldQuantity > 0) {
					const purchaseBill = await PurchaseBill.findOne({
						items: {
							$elemMatch: {
								code: item.code,
								instock: { $gt: 0 },
							},
						},
					}).sort({ createdAt: 1 }).session(session);

					if (purchaseBill) {
						if (!purchaseBill._soldItems) purchaseBill._soldItems = new Map();
						const purchasedItem = purchaseBill.items.find(
							(purchaseBillItem) => purchaseBillItem.code === item.code
						);
						const stockReduction = purchasedItem.instock >= soldQuantity ? soldQuantity : purchasedItem.instock;
						purchasedItem.instock -= stockReduction;

						if (!purchaseBill._soldItems.has(purchasedItem._id.toString())) {
							purchaseBill._soldItems.set(purchasedItem._id.toString(), -stockReduction);
						} else {
							purchaseBill._soldItems.set(purchasedItem._id.toString(), purchaseBill._soldItems.get(purchasedItem._id.toString()) - stockReduction);
						}

						const indexOfSalesBill = purchaseBill.sales.findIndex(salesBill => salesBill.toString() === bill._id.toString());
						if (indexOfSalesBill === -1) {
							purchaseBill.sales.push({
								bill: bill._id,
								items: [
									{ code: purchasedItem.code, quantity: stockReduction, amount: stockReduction * purchasedItem.rate }
								]
							});
						} else {
							purchaseBill.sales[indexOfSalesBill].items.push({
								code: purchasedItem.code,
								quantity: stockReduction,
								amount: stockReduction * purchasedItem.rate
							});
						}

						await purchaseBill.save({ session });

						soldQuantity -= stockReduction;
					} else {
						await session.abortTransaction();
						return next(new Error(`No record of purchased stock found for ${item.name}`));
					}
				}
			} catch (err) {
				await session.abortTransaction();
				return next(err);
			}
			// const product = await Product.findOne({ _id: item._id, stocked: true });
			// if (product) {
			// 	if (product.stock - item.converted >= 0) {
			// 		product.stock -= item.converted;
			// 		await product.save();
			// 	} else {
			// 		next(new Error(`Stock of ${product.name} is insufficient`));
			// 	}
			// }
		}
		await session.commitTransaction();
		next();
	} catch (error) {
		console.error(error);
		next(error);
	}
});
// BillSchema.virtual("itemsTotalAmount").get(function () {
// 	return this.calculateItemsTotalAmount();
// });

// BillSchema.virtual("billAmount").get(function () {
// 	return this.calculateBillAmount();
// });

// set discount in amount that converts to percentage
// BillSchema.virtual("discountAmount").set(function (amount) {
// 	const itemsTotalAmount = this.itemsTotalAmount;
// 	this.discountPercentage = parseFloat(((amount / itemsTotalAmount) * 100).toFixed(2));
// });

/**
 *	derive discount percentage from the discount amount
 */
BillSchema.virtual("discountPercentage")
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
 * @returns {object} BillSchema ready object
 */
BillSchema.statics.populateItemsWithQuantity = async function (items) {
	var populatedItems = [];

	for (let item of items) {
		const document = await Product.findOne({ _id: item._id }).lean().exec();
		if (document) {
			document.quantity = item.quantity;
			if (item.unit) {
				const unit = document.units.find(unit => unit.name === item.unit.toLowerCase());
				if (unit) {
					document.unit = unit.name;
					document.mrp = unit.mrp;
					document.rate = unit.rate;
					document.converted = unit.conversion * item.quantity;
					document.cost = unit.cost;
				}
			} else {
				document.unit = document.primaryUnit;
				document.converted = document.quantity;
			}
			populatedItems.push(document);
		} else {
			// apiResponse.ErrorResponse(res,`Product not found:${item.id}`);
			throw new Error(`Product not found:${item.id}`);
		}
	}

	return populatedItems;
};

BillSchema.plugin(mongoosePaginate);
BillSchema.index({ serialNumber: 1, belongsTo: 1 }, { unique: true });
BillSchema.plugin(AutoIncrement,
	{
		id: "bill_sequence",
		inc_field: "serialNumber",
		reference_fields: ["belongsTo"],
		start_seq: 1
	}
);

module.exports = BillSchema;
