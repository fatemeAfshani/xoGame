const express = require("express");
const User = require("../models/User");
const { auth, isAdmin } = require("../middlewares/Auth");
const multer = require("multer");
const path = require("path");
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

router.post("/user", auth, isAdmin, async (req, res) => {
  try {
    const user = new User(req.body);
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

//multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/img");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

router.post(
  "/avatar/:id",
  auth,
  isAdmin,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const filePath = req.file.path.replace(/\\/g, "/").split("/");
      const imagePath = `./img/${filePath[filePath.length - 1]}`;
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(400).send({ message: "can not find user" });
      }
      user.avatar = imagePath;
      await user.save();

      res.send(user);
    } catch (error) {
      res.status(500).send({ message: "unable to upload avatar image", error });
    }
  }
);

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
