var express = require("express");
var authRouter = require("./auth");
var customerRouter = require("./customer");
var productRouter = require("./product");
var billRouter = require("./bill");
var purchasebillRouter = require("./purchasebill");

var app = express();

app.use("/auth/", authRouter);
app.use("/customer/", customerRouter);
app.use("/product/", productRouter);
app.use("/bill/", billRouter);
app.use("/purchasebill/", purchasebillRouter);

module.exports = app;