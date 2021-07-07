const express = require("express");
const Board = require("../models/Board");
const { auth } = require("../middlewares/Auth");
const { setJoinTimeOut } = require("../utils/gameUtils");
let config = require("../models/Config");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    if (
      !req.body.gem ||
      !config.validCredits.includes(req.body.gem) ||
      req.user.credit < req.body.gem
    ) {
      return res.status(400).send({ message: "gem number is invalid" });
    }

    const board = new Board({
      user1: {
        id: req.user._id,
        nickName: req.user.nickName,
        avatar: req.user.avatar,
      },
      gem: req.body.gem,
    });

    await board.save();
    setJoinTimeOut(board._id);
    res.status(201).send(board);
  } catch (error) {
    return res.status(400).send({ message: "unable to create board", error });
  }
});

router.get("/mine", auth, async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ "user1.id": req.user._id }, { "user2.id": req.user._id }],
    });
    console.log(boards);
    return res.send(boards);
  } catch (error) {
    return res.status(500).send({ message: "cant get your boards", error });
  }
});

module.exports = router;
