const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "index.html";
}

//dom elements
const $errorMessage = document.querySelector("#error-message");
const $boardData = document.querySelector("#board-data");
const $messages = document.querySelector("#messages");
const $myform = document.querySelector("#messageForm");
const $formButton = $myform.querySelector("button");
const $formInput = $myform.querySelector("input");
const $formError = $myform.querySelector("p");
const $board = document.getElementById("board");
const $cells = document.querySelectorAll("[data-cell]");
const $gameStatus = document.querySelector("#game-status");
const $gameMessage = document.querySelector("#game-message");

//templates
const boardDataTemplate = document.querySelector(
  "#board-data-template"
).innerHTML;
const messageHistoryTemplate = document.querySelector(
  "#message-history-template"
).innerHTML;
const messageTemplate = document.querySelector("#message-template").innerHTML;
const gameStatusTemplate = document.querySelector(
  "#game-status-template"
).innerHTML;

//variables
const { id } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
let myData = {};
let turn = "";
let moves = [];
const x_Class = "x";
const o_Class = "o";

//init socket
const socket = io("/playground", {
  extraHeaders: {
    board: id,
  },
});

//functions
const showError = (error, domElement) => {
  const errorMessage =
    error.response && error.response.data.message
      ? error.response.data.message
      : error.message;
  domElement.innerHTML = errorMessage;
};

const getUserData = async () => {
  try {
    const { data: user } = await axios.get(
      "http://localhost:3001/api/user/me",
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    myData = user;
  } catch (error) {
    showError(error, $errorMessage);
  }
};

function sethover() {
  board.classList.remove(o_Class);
  board.classList.remove(x_Class);
  if (turn == myData.turn) {
    board.classList.add(myData.turn);
  } else {
    $cells.forEach((cell) => {
      cell.removeEventListener("click", clickCell);
    });
  }
}

function clickCell(e) {
  const cell = e.target;
  if (turn == myData.turn) {
    //adding mark

    cell.classList.add(myData.turn);
    const data = {
      turn,
      index: cell.getAttribute("data-index"),
    };

    //change turn
    socket.emit("change", data);
    sethover();
  }
}

const continueGame = () => {
  $gameMessage.innerHTML = "";
  $gameStatus.innerHTML = "";
  $cells.forEach((cell) => {
    const index = cell.getAttribute("data-index");
    if (moves[index] == 0) {
      cell.classList.remove(o_Class);
      cell.classList.remove(x_Class);
      cell.addEventListener("click", clickCell, { once: true });
    } else if (moves[index] == x_Class) {
      cell.classList.add(x_Class);
    } else {
      cell.classList.add(o_Class);
    }
  });
  sethover();
};

const startGame = () => {
  $gameMessage.innerHTML = "";
  $gameStatus.innerHTML = "";
  $cells.forEach((cell) => {
    cell.classList.remove(o_Class);
    cell.classList.remove(x_Class);
    cell.addEventListener("click", clickCell, { once: true });
  });
  sethover();
};

function checkStatus() {
  if (turn.length == 0 || moves.length == 0) {
    setTimeout(checkStatus, 1000);
    return;
  } else {
    const newGame = moves.every((move) => {
      return move == 0;
    });
    if (newGame) {
      startGame();
    } else {
      continueGame();
    }
  }
}

//start script
getUserData();
checkStatus();

socket.on("connect", () => {
  console.log("connected to socket");
});

socket.on("boardData", (board) => {
  const html = Mustache.render(boardDataTemplate, {
    user1NickName: board.user1.nickName,
    user1Avatar: board.user1.avatar,
    gem: board.gem,
    user1Wins: board.user1Wins,
    user2Wins: board.user2Wins,
    rounds: board.roundsNumber,
    draws: board.drawsNumber,
    user2NickName: board.user2.nickName,
    user2Avatar: board.user2.avatar,
  });
  $boardData.innerHTML = html;
  if (myData._id == board.user1.id) {
    myData.turn = "x";
  } else {
    myData.turn = "o";
  }
});

socket.on("error", (error) => {
  showError(error, $errorMessage);
});

socket.on("message", (msg) => {
  const html = Mustache.render(messageTemplate, {
    nickName: msg.nickName,
    msg: msg.text,
    createdAt: moment(msg.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("messagesHistory", (messages) => {
  const convertedMessages = messages.map((message) => {
    return {
      createdAt: moment(message.createdAt).format("h:mm a"),
      nickName: message.nickName,
      text: message.text,
    };
  });
  const html = Mustache.render(messageHistoryTemplate, {
    messages: convertedMessages,
  });
  $messages.innerHTML = html;
});

socket.on("moves", (data) => {
  moves = data;
});

socket.on("turn", (data) => {
  turn = data;
});

socket.on("changesForClients", (data) => {
  turn = data.newTurn;
  moves = data.moves;
  continueGame();
});

const continueButtonListener = () => {
  socket.emit("continue", "", (newData) => {
    moves = newData.moves;
    turn = newData.turn;
    const { board } = newData;
    const html = Mustache.render(boardDataTemplate, {
      user1NickName: board.user1.nickName,
      user1Avatar: board.user1.avatar,
      gem: board.gem,
      user1Wins: board.user1Wins,
      user2Wins: board.user2Wins,
      rounds: board.roundsNumber,
      draws: board.drawsNumber,
      user2NickName: board.user2.nickName,
      user2Avatar: board.user2.avatar,
    });
    $boardData.innerHTML = html;
    startGame();
  });
};

socket.on("endRound", ({ board, status }) => {
  const html = Mustache.render(gameStatusTemplate, {
    status,
  });
  $gameStatus.innerHTML = html;
  $cells.forEach((cell) => {
    cell.removeEventListener("click", clickCell);
  });
  document.querySelector("#finish-game").addEventListener("click", () => {
    socket.emit("finish", "", (error) => {
      if (error) {
        showError(error, $errorMessage);
      } else {
        window.location.href = "index.html";
      }
    });
  });

  document
    .querySelector("#continue-game")
    .addEventListener("click", continueButtonListener);
});

socket.on("otherUserDecision", (data) => {
  if (data.decision == "continue") {
    $gameMessage.innerHTML = "the other user decide to continue :)";
  } else if (data.decision == "end") {
    $gameMessage.innerHTML =
      "the other user decide to finish the game, thanks for playing :), please click <a href='index.html'>here </a> to go back to lobby";
    const continueButton = document.querySelector("#continue-game");
    if (continueButton) {
      continueButton.removeEventListener("click", continueButtonListener);
    }
  }
});

$myform.addEventListener("submit", (e) => {
  e.preventDefault();
  $formError.innerHTML = "";
  //disable form to submit again
  $formButton.setAttribute("disabled", "disabled");

  //e.target stands for the target of this event that is #messageform and in its 'elements' we access the element by its name
  const message = {
    nickName: myData.nickName,
    text: e.target.elements.msgInput.value,
  };
  socket.emit("myMessage", message, (error) => {
    //enable form to submit
    $formButton.removeAttribute("disabled");
    $formInput.value = "";
    $formInput.focus();
    if (error) {
      showError(error, $formError);
      return console.log(error);
    }
  });
});
