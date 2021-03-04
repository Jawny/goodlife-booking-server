const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { paymentRoute, usersRoute, webhook } = require("./routes/index");
require("dotenv").config();

mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.kqhf8.mongodb.net/goodlife?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
);

const PORT = process.env.PORT || 8000;
const app = express();

// Allow CORS
app.use(cors());

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Parse application/json
app.use(bodyParser.json());

// Add payments and users routes
app.use("/payments", paymentRoute);
app.use("/users", usersRoute);
app.use("/webhook", webhook);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`)); // listens on this port
