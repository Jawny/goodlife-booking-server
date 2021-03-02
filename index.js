const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const Cryptr = require("cryptr");
const Stripe = require("stripe");
const { verifyLoginCredentials } = require("./utils/verifyLoginCredentials");
require("dotenv").config();

const cryptr = new Cryptr(process.env.CRYPTR_KEY);
const stripe = Stripe(process.env.STRIPE_SECRET);

mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.kqhf8.mongodb.net/goodlife?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
);

const app = express();
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

const PORT = process.env.PORT || 8000;
const userDataSchema = new mongoose.Schema({
  userid: String,
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
});

const userData = mongoose.model("UserData", userDataSchema);

app.post("/", async (req, res) => {
  const result = await verifyLoginCredentials(
    req.body.email,
    req.body.password
  );
  const encryptedPassword = cryptr.encrypt(req.body.password);

  if (result.status === 200) {
    await userData.updateMany(
      { userid: req.body.userid },
      {
        $set: {
          email: req.body.email,
          password: encryptedPassword,
          clubId: req.body.clubId,
          province: req.body.province,
          monday: req.body.monday,
          tuesday: req.body.tuesday,
          wednesday: req.body.wednesday,
          thursday: req.body.thursday,
          friday: req.body.friday,
          saturday: req.body.saturday,
          sunday: req.body.sunday,
        },
      },
      { upsert: true }
    );
    await res.send(true);
    console.log("sending:", true);
  } else {
    await res.send(false);
    console.log("sending:", false);
  }
});

app.post("/payment/update", cors(), async (req, res) => {
  const { email } = req.body;
  const customer = await stripe.customers.retrieve(email);
  console.log(customer);
  // Authenticate your user.
  // const session = await stripe.billingPortal.sessions.create({
  //   customer: customer.id,
  //   return_url: "http://localhost:3000/",
  // });

  // res.send(session.url);
});
app.post("/payment", cors(), async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1IQ2EwE6MqegVpJXrqqaXrTJ",
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url:
        "https://example.com/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://example.com/canceled.html",
    });
    const checkoutsession = await stripe.checkout.sessions.retrieve(session.id);
    console.log("checkoutsession", checkoutsession);
    const portalsession = await stripe.billingPortal.sessions.create({
      customer: checkoutsession.id,
      return_url: returnUrl,
    });

    res.send(portalsession);
  } catch (e) {
    res.status(400);
    return res.send({
      error: {
        message: e.message,
      },
    });
  }
});

app.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Stubborn Attachments",
            images: ["https://i.imgur.com/EHyR2nP.png"],
          },
          unit_amount: 2000,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "https://i.imgur.com/EHyR2nP.png",
    cancel_url: "https://google.com",
  });
  res.json({ id: session.id });
});

// app.post("/payment", cors(), async (req, res) => {
//   const { payment_method, email } = req.body;
//   try {
//     const customer = await stripe.customers.create({
//       payment_method,
//       email,
//       invoice_settings: {
//         default_payment_method: payment_method,
//       },
//     });

//     const subscription = await stripe.subscriptions.create({
//       customer: customer.id,
//       items: [{ plan: "price_1IQ2EwE6MqegVpJXrqqaXrTJ" }],
//       expand: ["latest_invoice.payment_intent"],
//     });

//     const status = subscription["latest_invoice"]["payment_intent"]["status"];
//     const clientSecret =
//       subscription["latest_invoice"]["payment_intent"]["client_secret"];

//     res.json({ clientSecret, status });
//   } catch (error) {
//     console.log("error", error);
//     res.json({ message: "payment failed", success: false });
//   }
// });

app.get("/users/:id", async (req, res) => {
  const users = await userData.findOne({ userid: req.params.id });
  if (!users) {
    res.send(false);
  }
  res.send(true);
});

// app.post("/payment", cors(), async (req, res) => {
//   let { amount, id } = req.body;
//   try {
//     const payment = await stripe.paymentIntents.create({
//       amount,
//       currency: "CAD",
//       description: "Goodlife Fitness Auto",
//       payment_method: id,
//       confirm: true,
//     });
//     console.log("payment", payment);
//     res.json({ message: "Payment Successful", success: true });
//   } catch (error) {
//     console.log("error", error);
//     res.json({ message: "payment failed", success: false });
//   }
// });

app.listen(PORT, () => console.log(`Server started on port ${PORT}`)); // listens on this port
