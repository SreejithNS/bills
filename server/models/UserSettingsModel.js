var mongoose = require("mongoose");

var Schema = require("./schemas/UserSettingsSchema");

exports.UserSettings = mongoose.model("UserSettings", Schema);