const axios = require("axios");

const generateMessage = ({ nickName, text }) => {
  return {
    nickName,
    text,
    createdAt: new Date().getTime(),
  };
};

//we can request to database directly or use api
const getBoardData = async (boardId) => {
  try {
    const { data: board } = await axios.get(
      `http://localhost:3001/api/game/socket/${boardId}`
    );
    return { board };
  } catch (err) {
    const error =
      err.response && err.response.data.message
        ? err.response.data.message
        : err.message;
    return { error };
  }
};

const winning_possibility = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const checkGameStatus = (moves) => {
  const XWins = winning_possibility.some((posibility) => {
    return posibility.every((x) => {
      return moves[x] == "x";
    });
  });
  const OWins = winning_possibility.some((posibility) => {
    return posibility.every((x) => {
      return moves[x] == "o";
    });
  });

  const isDraw = moves.every((move) => {
    return move != 0;
  });
  return {
    XWins,
    OWins,
    isDraw,
  };
};

const finishGame = async (board) => {
  let isDraw = false;
  let winner = "";
  let winnerNickName = "";
  let loser = "";
  if (board.user1Wins == board.user2Wins) {
    isDraw = true;
  } else if (board.user1Wins > board.user2Wins) {
    winner = board.user1.id;
    winnerNickName = board.user1.nickName;
    loser = board.user2.id;
  } else {
    winner = board.user2.id;
    winnerNickName = board.user2.nickName;
    loser = board.user1.id;
  }
  try {
    const { data: newBoard } = await axios.patch(
      `http://localhost:3001/api/game/finish/${board._id}`,
      {
        roundsNumber: board.roundsNumber,
        drawsNumber: board.drawsNumber,
        user1Wins: board.user1Wins,
        user2Wins: board.user2Wins,
        isDraw,
        winner: winnerNickName,
      }
    );
    if (!isDraw) {
      const { data: winnerUser } = await axios.patch(
        `http://localhost:3001/api/game/user/${winner}`,
        {
          credit: board.gem,
          status: "winner",
        }
      );
      const { data: loserUser } = await axios.patch(
        `http://localhost:3001/api/game/user/${loser}`,
        {
          credit: board.gem,
          status: "loser",
        }
      );
    }

    return { board };
  } catch (err) {
    const error =
      err.response && err.response.data.message
        ? err.response.data.message
        : err.message;
    return { error };
  }
};

module.exports = {
  finishGame,
  generateMessage,
  getBoardData,
  checkGameStatus,
};
