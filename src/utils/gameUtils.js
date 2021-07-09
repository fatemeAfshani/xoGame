let config = require("../models/Config");
const Board = require("../models/Board");

const setJoinTimeOut = (boardId) => {
  try {
    setTimeout(async () => {
      const board = await Board.findById(boardId);
      if (board && !board.user2.id) {
        await Board.findByIdAndDelete({ _id: boardId });
      }
    }, config.joinTimeOut * 1000);
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = { setJoinTimeOut };
