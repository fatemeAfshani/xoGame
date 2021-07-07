const mongoose = require("mongoose");

const configSchema = mongoose.Schema(
  {
    joinTimeOut: {
      type: Number,
      default: 60,
    },
    moveTimeOut: {
      type: Number,
      default: 30,
    },
    validCredits: [Number],
    bannedWords: [String],
  },
  {
    timestamps: true,
  }
);

const Config = mongoose.model("Config", configSchema);

let config = new Config();

module.exports = config;
