const express = require("express");
const Stripe = require("stripe");
require("dotenv").config();

const stripe = Stripe(process.env.STRIPE_SECRET);
const paymentRoute = express.Router();

/*
Creates a stripe customer object.

Accept email string and authUserId and create a stripe customer.

Return the stripe customer object with authUserId in the metadata.
*/
paymentRoute.post("/create-customer", async (req, res) => {
  const { email, authUserId } = req.body;
  const customer = await stripe.customers.create({
    email,
    metadata: { auth: authUserId },
  });
  res.send(customer);
});

paymentRoute.post("/retrieve-customer", async (req, res) => {
  const { customerId } = req.body;

  const customer = await stripe.customers.retrieve(customerId);

  res.send(customer);
});

/*
Creates a checkout page url for the customer with 
the Goodlife $10 subscription selected as the product.

Accept email, auth userId, and customerId strings. 

Return the stripe checkout session object.
*/
paymentRoute.post("/create-checkout", async (req, res) => {
  const { email, customerId } = req.body;
  console.log("customerid", customerId);
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_ITEM, quantity: 1 }],
    mode: "subscription",
    allow_promotion_codes: true,
    success_url: `${process.env.DOMAIN}/success`,
    cancel_url: `${process.env.DOMAIN}/error`,
  });
  console.log("session", session);
  res.send(session);
});

/*
Creates a billing portal url link for customer to update their personal information or
modify their subscription.

Accept customerId string and create a billing portal session
with the customerId. When the customer finishes their updates return
to the profile page. 

Return the billing portal url link.
*/
paymentRoute.post("/update-billing-information", async (req, res) => {
  const { customerId } = req.body;
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.DOMAIN}/profile`,
  });

  res.send(session.url);
});

/*
Checks if a customer is still subscribed to the plan.

Accept subscriptionId string.

Return subscription. status will return either "active" or "cancelled" or 404.
*/
paymentRoute.post("/get-subscription-status", async (req, res) => {
  const { subscriptionId } = req.body;
  console.log("sub", req.body);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  if (subscription) {
    res.send(subscription.status);
    return;
  }

  res.send({ status: 404 });
});

/*
Retrieve user's checkout session

Accept sessionId

Return stripe session object. status will return either "paid" or "unpaid" or 404.
*/
paymentRoute.get("/get-checkout-session", async (req, res) => {
  const { sessionId } = req.body;
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session) {
    res.send(session);
    return;
  }

  res.send({ status: 404 });
});

module.exports = paymentRoute;
