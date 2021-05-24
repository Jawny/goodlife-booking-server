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
    monday: Number | Array,
    tuesday: Number | Array,
    wednesday: Number | Array,
    thursday: Number | Array,
    friday: Number | Array,
    saturday: Number | Array,
    sunday: Number | Array,
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
