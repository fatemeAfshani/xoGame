require("dotenv").config({ path: "./src/config/dev.env" });
require("./startup/mongoose");
const express = require("express");
const path = require("path");
const cors = require("cors");
const adminPanelRouter = require("./routers/adminRouter");
const gameRouter = require("./routers/gameRouter");
const userRouter = require("./routers/userRouter");

const app = express();
require("./startup/socket")(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/admin", adminPanelRouter);
app.use("/api/game", gameRouter);
app.use("/api/user", userRouter);

const publicPath = path.join(__dirname, "./public");
app.use(express.static(publicPath));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`app is up and running on port ${port}`);
});
