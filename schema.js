const mongoose = require("mongoose");

const userDataSchema = new mongoose.Schema({
  auth: {
    email: String,
    verified: Boolean,
    userId: String,
  },
  goodlife: {
    email: String,
    password: String,
    province: String,
    clubId: Number,
    monday: Number,
    tuesday: Number,
    wednesday: Number,
    thursday: Number,
    friday: Number,
    saturday: Number,
    sunday: Number,
  },
  payment: {
    customerId: String,
    email: String,
    subId: String,
    tempSession: String,
  },
});

const userData = mongoose.model("UserData", userDataSchema);

module.exports = { userData };
