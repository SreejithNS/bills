require("dotenv").config();

// DB connection
var MONGODB_URL = process.env.MONGODB_URL;
var mongoose = require("mongoose");
const BillModel = require("../../models/BillModel");
const CustomerModel = require("../../models/CustomerModel");
const ProductModel = require("../../models/ProductModel");

mongoose
	.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		//don't show the log when it is test
		if (process.env.NODE_ENV !== "test") {
			console.log("Connected to %s", MONGODB_URL);
			generateRandomBills(20, 6)
				.then((queue) => {
					console.log(`Bills Generator:\nCount:${queue.length}`);
					return BillModel.insertMany(queue);
				}, console.error)
				.then((docs) => {
					console.log(`Inserted ${docs.length} new Bill`);
					process.exit();
				}, console.error);
		}
	})
	.catch((err) => {
		console.error("App starting error:", err.message);
		process.exit(1);
	});

async function generateRandomBills(
	billCount = 5,
	productsCount = 3,
	maxQuantity = 10
) {
	const products = await ProductModel.find({}).lean().exec();
	const customers = await CustomerModel.find({}, "_id").lean().exec();
	const soldBy = "5fa27598fcdb9113f46e4ec7";

	const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
	const getRandomCount = (max) => Math.floor(Math.random() * max) + 1;

	const insertQueue = [];

	for (var billIteration = 0; billIteration < billCount; billIteration++) {
		const customerId = getRandomItem(customers)._id;
		const request = {
			customer: customerId,
			soldBy,
			items: [],
			discountAmount: 0,
		};

		for (
			var productIteration = 0;
			productIteration < getRandomCount(productsCount);
			productIteration++
		) {
			const product = getRandomItem(products);
			product.quantity = getRandomCount(maxQuantity);

			request.items.push(product);
		}

		const bill = new BillModel(request);
		bill.itemsTotalAmount = bill.calculateItemsTotalAmount();
		bill.billAmount = bill.calculateBillAmount();

		insertQueue.push(bill);
	}

	return insertQueue;
}
