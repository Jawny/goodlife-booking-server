const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const Cryptr = require("cryptr");
const { CheckLoginCredentials } = require("./CheckLoginCredentials");
require("dotenv").config();

const cryptr = new Cryptr(process.env.CRYPTR_KEY);

mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.kqhf8.mongodb.net/goodlife?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
);

const app = express();
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

const PORT = process.env.PORT || 8000;
const userDataSchema = new mongoose.Schema({
  email: String,
  password: String,
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
  const result = await CheckLoginCredentials(req.body.email, req.body.password);
  const encryptedPassword = cryptr.encrypt(req.body.password);

  if (result.toString()[0] === "2") {
    await userData.updateMany(
      { email: req.body.email },
      {
        $set: {
          password: encryptedPassword,
          clubId: req.body.clubId,
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
  } else {
    await res.send(false);
  }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`)); // listens on this port
