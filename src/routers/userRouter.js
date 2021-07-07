const express = require("express");
const User = require("../models/User");
const { auth } = require("../middlewares/Auth");

const router = express.Router();

router.get("/getUserToken", async (req, res) => {
  try {
    const user = await User.findOne({ isTaken: false });
    if (user) {
      res.send(user.token);
    } else {
      res.status(400).send({ message: "there is no user left" });
    }
  } catch (error) {
    res.status(500).send({ message: "unable to get user token", error });
  }
});

router.get("/login", auth, async (req, res) => {
  try {
    if (!req.user.isTaken) {
      req.user.isTaken = true;
      await req.user.save();
      res.send(req.user);
    } else {
      res.status(400).send({ message: "user is taken already" });
    }
  } catch (error) {
    res.status(400).send({ message: "unable to login", error });
  }
});

router.get("/me", auth, (req, res) => {
  res.send(req.user);
});

// router.get("/avatar", auth, async (req, res) => {
//   try {
//     if (!req.isvalidtoupdateuser.avatar) {
//       throw new Error("not found");
//     }

//     res.set("Content_Type", "image/png");
//     res.send(user.avatar);
//   } catch (e) {
//     res.status(404).send({ message: e.message, error });
//   }
// });

module.exports = router;
