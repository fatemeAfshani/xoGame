const express = require("express");
const redis = require("redis");
const Board = require("../models/Board");
const User = require("../models/User");
const { auth } = require("../middlewares/Auth");
const { setJoinTimeOut } = require("../utils/gameUtils");
let config = require("../models/Config");

const publisher = redis.createClient();

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
    return res.send(boards);
  } catch (error) {
    return res.status(500).send({ message: "cant get your boards", error });
  }
});

router.get("/open", auth, async (req, res) => {
  try {
    const boards = await Board.find({
      $and: [{ "user2.id": null }, { "user1.id": { $ne: req.user._id } }],
    });
    const validBoardsForUser = boards.filter(
      (board) => board.gem <= req.user.credit
    );
    return res.send(validBoardsForUser);
  } catch (error) {
    return res
      .status(500)
      .send({ message: "cant find any open boards", error });
  }
});

router.patch("/join/:id", auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board || board.user2.id) {
      return res.status(400).send({ message: "you cant join to this board" });
    } else if (req.user.credit < board.gem) {
      return res
        .status(400)
        .send({ message: "you dont have enough credit to join" });
    } else {
      board.user2 = {
        id: req.user.id,
        nickName: req.user.nickName,
        avatar: req.user.avatar,
      };
      await board.save();
      publisher.publish("server", `${board._id}`);

      return res.send(board);
    }
  } catch (error) {
    return res.status(500).send({ message: "unable to join to board", error });
  }
});

router.patch("/finish/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const shouldupdate = [
    "roundsNumber",
    "drawsNumber",
    "user1Wins",
    "user2Wins",
    "isDraw",
    "winner",
  ];
  const isvalidtoupdate = updates.every((update) => {
    return shouldupdate.includes(update);
  });
  if (!isvalidtoupdate) {
    return res.status(400).send({ message: "invalid update" });
  }
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(400).send({ message: "can not find board" });
    }
    updates.forEach((update) => (board[update] = req.body[update]));
    await board.save();
    res.send(board);
  } catch (error) {
    return res.status(500).send({ message: "unable to update board", error });
  }
});

router.patch("/user/:id", async (req, res) => {
  if (!req.body.credit || !req.body.status) {
    return res.status(400).send({ message: "invalid input" });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).send({ message: "can not find user" });
    }
    if (req.body.status == "winner") {
      user.credit += req.body.credit;
    } else if (req.body.status == "loser") {
      user.credit -= req.body.credit;
    }

    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send({ message: "unable to update", error });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(400).send({ message: " no board with this id" });
    }
    return res.send({
      board,
      joinTimeOut: config.joinTimeOut,
      user: req.user,
      moveTimeOut: config.moveTimeOut,
    });
  } catch (error) {
    return res.status(500).send({ message: "unable to get board", error });
  }
});

router.get("/socket/:id", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(400).send({ message: " no board with this id" });
    }
    return res.send(board);
  } catch (error) {
    return res.status(500).send({ message: "unable to get board", error });
  }
});

module.exports = router;
