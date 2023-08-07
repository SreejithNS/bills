var express = require("express");
var authRouter = require("./auth");
var customerRouter = require("./customer");
var productRouter = require("./product");
var billRouter = require("./bill");
var purchasebillRouter = require("./purchasebill");
var checkInController = require("../controllers/CheckIns/index");
var analyticsController = require("../controllers/Analytics/index");

var app = express();

app.use("/auth/", authRouter);
app.use("/customer/", customerRouter);
app.use("/product/", productRouter);
app.use("/bill/", billRouter);
app.use("/purchasebill/", purchasebillRouter);
app.use(checkInController.apiPath, checkInController.getRouter());
app.use(analyticsController.apiPath, analyticsController.getRouter());

module.exports = app;