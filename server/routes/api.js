var express = require("express");
var authRouter = require("./auth");
var bookRouter = require("./book");
var customerRouter = require("./customer");
var productRouter = require("./product");
var billRouter = require("./bill");

var app = express();

app.use("/auth/", authRouter);
app.use("/book/", bookRouter);
app.use("/customer/", customerRouter); // All Customer Data Related Functions
app.use("/product/", productRouter);
app.use("/bill/",billRouter);

module.exports = app;