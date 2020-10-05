var express = require("express");
var authRouter = require("./auth");
var bookRouter = require("./book");
var customerRouter = require("./customer");

var app = express();

app.use("/auth/", authRouter);
app.use("/book/", bookRouter);
app.use("/customer/", customerRouter); // All Customer Data Related Functions

module.exports = app;