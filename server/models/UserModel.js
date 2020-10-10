var mongoose = require("mongoose");
const privilegeEnum = require("../helpers/privilegeEnum");

var UserSchema = new mongoose.Schema({
	firstName: {type: String, required: true},
	lastName: {type: String, required: false},
	email: {type: String, required: false},
	phone:{type:Number,required:true,indexes:{unique:true} },
	type:{type:Number,default:privilegeEnum.salesman},
	password: {type: String, required: true},
	isConfirmed: {type: Boolean, required: true, default: true},
	confirmOTP: {type: String, required:false},
	otpTries: {type: Number, required:false, default: 0},
	status: {type: Boolean, required: true, default: 1}
}, {timestamps: true});

// Virtual for user's full name
UserSchema
	.virtual("fullName")
	.get(function () {
		// eslint-disable-next-line no-extra-boolean-cast
		return this.firstName + ((!!this.lastName)? " " + this.lastName : "");
	})
	.set(function (fullName){
		const splitted = fullName.split(" ");
		this.firstName = splitted[0];
		this.lastName = splitted[1] || undefined;
	});

module.exports = mongoose.model("User", UserSchema);