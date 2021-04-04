const express = require("express");
const Cryptr = require("cryptr");
const { userData } = require("../schema");
const { verifyLoginCredentials } = require("../utils/index");

const cryptr = new Cryptr(process.env.CRYPTR_KEY);
const usersRoute = express.Router();

/*
Returns auth userId if it exists.

Accept auth0 sub id

Return false if userId does not exist in the DB, else return the userId 
*/
usersRoute.get("/:id", async (req, res) => {
  const { id } = req.params;

  const userId = await userData.findOne({ "auth.userId": id });
  console.log(userId);

  res.send(userId);
});

/*
Creates a user

Accept formatted auth, goodlife, and payment objects (see Schema for format).
Verify that the goodlife user credentials are correct. if they are incorrect
return a 400. Otherwise encrypt their password and add their details to DB.

Return 200 if user is created successfully, else return the error
*/
usersRoute.post("/create-user", async (req, res) => {
  const { auth, payment } = req.body;
  let { goodlife } = req.body;
  const { email, password } = goodlife;
  const verification = await verifyLoginCredentials(email, password);

  if (!verification) {
    res.send({ status: 400 });
    return;
  }

  goodlife.password = cryptr.encrypt(password);

  await userData.create({ auth, goodlife, payment }, (err, result) => {
    if (err) {
      res.send(err);
      return;
    }
  });

  res.send({ status: 200 });
});

/*
Updates a user's Goodlife information

Accept goodlife properties (See Schema for details). Check if the goodlife
account is valid. If not then return 400 else query the db for the data and
update their details.

Return 200 if user's Goodlife information is updated, else return the error.
*/
usersRoute.put("/update-user-goodlife", async (req, res) => {
  const {
    authUserId,
    authEmail,
    verified,
    email,
    password,
    province,
    clubId,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
  } = req.body;

  // const verification = await verifyLoginCredentials(email, password);

  // if (verification.status !== 200) {
  //   res.send({ status: 400 });
  //   return;
  // }

  const encryptedPassword = cryptr.encrypt(password);

  await userData
    .findOneAndUpdate(
      { "auth.userId": authUserId },
      {
        $set: {
          "auth.email": authEmail,
          "auth.verified": verified,
          "goodlife.email": email,
          "goodlife.password": encryptedPassword,
          "goodlife.province": province,
          "goodlife.clubId": clubId,
          "goodlife.monday": monday,
          "goodlife.tuesday": tuesday,
          "goodlife.wednesday": wednesday,
          "goodlife.thursday": thursday,
          "goodlife.friday": friday,
          "goodlife.saturday": saturday,
          "goodlife.sunday": sunday,
        },
      }
    )
    .exec((err, result) => {
      if (err) {
        res.send(err);
        return;
      }
    });

  res.send({ status: 200 });
});

/*
Updates a user's Auth information

Accept Auth properties (See Schema for details). Check if the Auth
account is valid. If not then return 400 else query the db for the data and
update their details.

Return 200 if user's Auth information is updated, else return the error.
*/
// UNTESTED ENDPOINT
usersRoute.put("/update-user-auth", async (req, res) => {
  const { authUserId, email, verified } = req.body;

  await userData
    .findOneAndUpdate(
      { "auth.userId": authUserId },
      {
        $set: {
          "auth.email": email,
          "auth.verified": verified,
        },
      }
    )
    .exec((err, result) => {
      if (err) {
        res.send(err);
        return;
      }
    });

  res.send({ status: 200 });
});

/*
Update user's payment information

Accept auth0 userId, payment email, customerId and subId. If auth userId 
is found then update user's payment details.

if payment details is successfully updated return 200, else return error.

*/
usersRoute.put("/update-user-payment", async (req, res) => {
  const { authUserId, email, customerId, subId } = req.body;

  await userData
    .findOneAndUpdate(
      { "auth.userId": authUserId },
      {
        $set: {
          "payment.email": email,
          "payment.customerId": customerId,
          "payment.subId": subId,
        },
      }
    )
    .exec((err, result) => {
      if (err) {
        res.send(err);
        return;
      }
    });

  res.send({ status: 200 });
});

/* 
Create/update user checkout session

Accept auth email, verified, and userId 

return 200 always TODO: add error checking
*/
usersRoute.post("/update-checkout-session", async (req, res) => {
  console.log("running");
  const { email, verified, userId, sessionId } = req.body;
  await userData
    .updateMany(
      { "auth.userId": userId },
      {
        $set: {
          "auth.userId": userId,
          "auth.email": email,
          "auth.verified": verified,
          "payment.tempSession": sessionId,
        },
      },
      { upsert: true }
    )
    .exec((err, result) => {
      if (err) {
        res.send(err);
        return;
      } else {
        res.send(result);
        return;
      }
    });
  // res.send({ status: 200 });
});

/* 
get user checkout session

Accept checkout sessionId

return checkout session, else return 404
*/
usersRoute.get("/get-checkout-session", async (req, res) => {
  const { sessionId } = req.body;
  const session = await userData.findOne({ "payment.tempSession": sessionId });
  if (session) {
    res.send(session);
    return;
  }

  res.send({ status: 404 });
});

module.exports = usersRoute;
