const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema(
  {
    nickName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      unique: true,
    },
    avatar: {
      type: String,
      default: "./img/default.jpg",
    },
    credit: { type: Number, default: 300 },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isTaken: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

//token will be generated based on user._id
userSchema.methods.createtoken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.SECRET_JWT);
  user.token = token;
  await user.save();
  return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
