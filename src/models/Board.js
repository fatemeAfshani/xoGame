const mongoose = require("mongoose");

const boardSchema = mongoose.Schema(
  {
    user1: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      nickName: { type: String },
      avatar: { type: String, default: "hi" },
    },
    user2: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      nickName: { type: String },
      avatar: { type: String, default: "hi" },
    },
    gem: {
      type: Number,
      required: true,
    },
    roundsNumber: { type: Number, default: 0 },
    drawsNumber: { type: Number, default: 0 },
    user1Wins: { type: Number, default: 0 },
    user2Wins: { type: Number, default: 0 },
    isDraw: { type: Boolean, default: false },
    winner: { type: String },
  },
  {
    timestamps: true,
  }
);

const Board = mongoose.model("Board", boardSchema);

module.exports = Board;
