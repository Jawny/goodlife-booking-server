const express = require("express");
const Stripe = require("stripe");
require("dotenv").config();

const stripe = Stripe(process.env.STRIPE_SECRET);
const webhook = express.Router();
/*
callback when customer subscription is created NOT CHECKING IF VERIFIED
*/
webhook.post("/customer-sub-created", async (req, res) => {
  const event = req.body;
  //   console.log(event.data.object);
  res.send({ status: 200 });
});

webhook.post("/payment-success", async (req, res) => {
  const event = req.body;
  const customerId = event.data.object.customer;
  console.log(customerId);
  const customer = await stripe.customers.retrieve(customerId);
  console.log("stripecustomer", customer);
  res.send({ status: 200 });
});

module.exports = webhook;
