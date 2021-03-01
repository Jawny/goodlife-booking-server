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

app.post("/create-customer-portal-session", cors(), async (req, res) => {
  const { payment_method, email } = req.body;
  const customer = await stripe.customers.create({
    payment_method,
    email,
    invoice_settings: {
      default_payment_method: payment_method,
    },
  });
  // Authenticate your user.
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: "http://localhost:3000/",
  });

  res.redirect(session.url);
});

app.post("/payment", cors(), async (req, res) => {
  const { payment_method, email } = req.body;
  try {
    const customer = await stripe.customers.create({
      payment_method,
      email,
      invoice_settings: {
        default_payment_method: payment_method,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ plan: "price_1IQ2EwE6MqegVpJXrqqaXrTJ" }],
      expand: ["latest_invoice.payment_intent"],
    });

    const status = subscription["latest_invoice"]["payment_intent"]["status"];
    const clientSecret =
      subscription["latest_invoice"]["payment_intent"]["client_secret"];

    res.json({ clientSecret, status });
  } catch (error) {
    console.log("error", error);
    res.json({ message: "payment failed", success: false });
  }
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
