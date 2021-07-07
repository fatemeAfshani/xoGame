const express = require("express");
const User = require("../models/User");
const { auth, isAdmin } = require("../middlewares/Auth");
const multer = require("multer");
const sharp = require("sharp");
let config = require("../models/Config");

const router = express.Router();

router.get("/create", async (req, res) => {
  try {
    const admin = new User({
      nickName: "admin",
      fullName: "admin",
      isAdmin: true,
      isTaken: true,
    });
    await admin.save();
    await admin.createtoken();

    res.status(201).send(admin);
  } catch (error) {
    res.status(500).send({ message: "something went wrong", error });
  }
});

// const avatar = multer({
//   // dest : 'avatars',
//   limits: {
//     fileSize: 1000000,
//   },
//   fileFilter(req, file, cb) {
//     if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
//       return cb(new Error("please send an image"));
//     }
//     cb(undefined, true);
//   },
// });

router.post("/user", auth, isAdmin, async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    await user.createtoken();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send({ message: "unable to create user", error });
  }
});

router.patch("/user/:id", auth, isAdmin, async (req, res) => {
  const updates = Object.keys(req.body);
  const shouldupdate = ["nickName", "fullName", "credit"];
  const isvalidtoupdate = updates.every((update) => {
    return shouldupdate.includes(update);
  });
  if (!isvalidtoupdate) {
    return res.status(400).send({ message: "invalid update" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).send({ message: "can not find user" });
    }
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send({ message: "unable to update", error });
  }
});

router.delete("/user/:id", auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete({ _id: req.params.id });
    if (!user) {
      return res.status(400).send({ message: "user already is deleted" });
    }
    res.send(user);
  } catch (error) {
    res.status(500).send({ message: "unable to delete", error });
  }
});

// router.post(
//   "/user/avatar",
//   auth,
//   isAdmin,
//   avatar.single("avatar"),
//   async (req, res) => {
//     console.log(req.file);
//     //this will work if we install sharp :/
//     const bufferedimg = await sharp(req.file.buffer)
//       .resize({ height: 250, width: 250 })
//       .png()
//       .toBuffer();

//     req.user.avatar = bufferedimg;
//     await req.user.save();

//     res.send();
//   },
//   (error, req, res, next) => {
//     res.status(400).send({ message: error.message });
//   }
// );

// router.delete("/user/avatar", auth, isAdmin, async (req, res) => {
//   try {
//     req.user.avatar = undefined;
//     await req.user.save();
//     res.send();
//   } catch (error) {
//     res.status(500).send({ message: "unable to delete avatar", error });
//   }
// });

router.get("/config", auth, (req, res) => {
  res.send(config);
});

router.patch("/config", auth, isAdmin, async (req, res) => {
  const updates = Object.keys(req.body);
  const shouldupdate = [
    "joinTimeOut",
    "moveTimeOut",
    "validCredits",
    "bannedWords",
  ];
  const isvalidtoupdate = updates.every((update) => {
    return shouldupdate.includes(update);
  });
  if (!isvalidtoupdate) {
    return res.status(400).send({ message: "invalid update" });
  }

  try {
    updates.forEach((update) => (config[update] = req.body[update]));
    await config.save();
    res.send(config);
  } catch (error) {
    res.status(500).send({ message: "unable to update", error });
  }
});

module.exports = router;
