const express = require("express");
const delay = require("delay");
const Stripe = require("stripe");
require("dotenv").config();
const { userData } = require("../schema");

const stripe = Stripe(process.env.STRIPE_SECRET);
const webhook = express.Router();
/*
callback when customer subscription is created NOT CHECKING IF VERIFIED
*/
webhook.post("/customer-sub-created", async (req, res) => {
  const event = req.body;
  const customerId = event.data.object.customer;
  const subscriptionId = event.data.object.id;
  // Retrieve customer
  const customer = await stripe.customers.retrieve(customerId);
  console.log("sub customer", customer);
  // update metadata
  let metaData = customer.metadata;
  metaData["sub_id"] = subscriptionId;
  await stripe.customers.update(customerId, { metadata: metaData });
  console.log(metaData);
  res.send({ status: 200 });
});

webhook.post("/checkout-complete", async (req, res) => {
  await delay(5000);
  const event = req.body;
  // Retrieve customer
  const customerId = event.data.object.customer;
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = customer.email;
  // console.log("customer", customer);
  // Retrieve metadata
  const metaData = customer.metadata;
  const { auth, sub_id: subId } = metaData;
  console.log("metaData", metaData);
  // Retrieve subscription status
  const subscription = await stripe.subscriptions.retrieve(subId);
  // console.log("subscription:", subscription);
  if (!subscription.status.toLowerCase() === "active") {
    // console.log("sub status not active:", subscription.status);
    res.send({ status: 400, msg: "inactive subscription" });
    return;
  }

  // Update database
  await userData
    .findOneAndUpdate(
      { "auth.userId": auth },
      {
        $set: {
          "payment.email": customerEmail,
          "payment.customerId": customerId,
          "payment.subId": subId,
        },
      },
      { upsert: true }
    )
    .exec((err, result) => {
      if (err) {
        res.send(err);
        return;
      }
    });

  res.send({ status: 200 });
});

module.exports = webhook;
