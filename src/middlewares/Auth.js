const User = require("../models/User");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const authorization = req.header("Authorization").replace("Bearer ", "");
    const verified = jwt.verify(authorization, process.env.SECRET_JWT);
    const user = await User.findOne({
      _id: verified._id,
      token: authorization,
    });

    if (!user) {
      throw new Error();
    }
    req.token = authorization;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send("Error : please authorize");
  }
};

const isAdmin = (req, res, next) => {
  try {
    if (req.user.isAdmin) {
      next();
    } else {
      throw new Error();
    }
  } catch (e) {
    res.status(403).send("Error: You are not allowed to do this operation");
  }
};

module.exports = { auth, isAdmin };
