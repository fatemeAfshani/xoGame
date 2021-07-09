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

console.log(moves, turn, myData);

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
    console.log(user);
    myData = user;
    console.log("myData", myData);
  } catch (error) {
    showError(error, $errorMessage);
  }
};

function sethover() {
  board.classList.remove(o_Class);
  board.classList.remove(x_Class);
  if (turn == myData.turn) {
    console.log("in set hover my turn");
    board.classList.add(myData.turn);
  } else {
    console.log("in set hover not my turn");
    $cells.forEach((cell) => {
      cell.removeEventListener("click", clickCell);
    });
  }
}

function clickCell(e) {
  const cell = e.target;
  if (turn == myData.turn) {
    //adding mark
    console.log("clicked a cell my turn");
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
  console.log("in continue game", moves);
  $cells.forEach((cell) => {
    const index = cell.getAttribute("data-index");
    if (moves[index] == 0) {
      cell.classList.remove(o_Class);
      cell.classList.remove(x_Class);
      cell.addEventListener("click", clickCell, { once: true });
      console.log("in continue game empty cell");
    } else if (moves[index] == x_Class) {
      console.log("in continue game X cell");
      cell.classList.add(x_Class);
    } else {
      console.log("in continue game O cell");
      cell.classList.add(o_Class);
    }
  });
  sethover();
};

const startGame = () => {
  $gameMessage.innerHTML = "";
  $gameStatus.innerHTML = "";
  console.log("in start game");
  $cells.forEach((cell) => {
    cell.classList.remove(o_Class);
    cell.classList.remove(x_Class);
    cell.addEventListener("click", clickCell, { once: true });
  });
  sethover();
};

function checkStatus() {
  console.log("in check status");
  if (turn.length == 0 || moves.length == 0) {
    console.log("still wating to get data");
    setTimeout(checkStatus, 1000);
    return;
  } else {
    console.log("moves, turn", moves, turn);
    const newGame = moves.every((move) => {
      return move == 0;
    });
    if (newGame) {
      console.log("in check status before calling start game");
      startGame();
    } else {
      console.log("in check status before calling continue game ");
      continueGame();
    }
  }
}

//start script
getUserData();
checkStatus();

socket.on("connect", () => {
  console.log("im connected");
});

socket.on("boardData", (board) => {
  console.log(board);
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
    console.log("my turn", myData.turn);
  } else {
    myData.turn = "o";
    console.log("my turn", myData.turn);
  }
});

socket.on("error", (error) => {
  console.log(error);
  showError(error, $errorMessage);
});

socket.on("message", (msg) => {
  console.log(msg);
  const html = Mustache.render(messageTemplate, {
    nickName: msg.nickName,
    msg: msg.text,
    createdAt: moment(msg.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("messagesHistory", (messages) => {
  console.log(messages);
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
  console.log(data);
  moves = data;
});

socket.on("turn", (data) => {
  console.log(data);
  turn = data;
  console.log(turn, myData);
});

socket.on("changesForClients", (data) => {
  console.log(data);
  turn = data.newTurn;
  moves = data.moves;
  continueGame();
});

const continueButtonListener = () => {
  console.log("clicked continue game button");
  socket.emit("continue", "", (newData) => {
    console.log(newData);
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
  console.log(board, status);
  const html = Mustache.render(gameStatusTemplate, {
    status,
  });
  $gameStatus.innerHTML = html;
  $cells.forEach((cell) => {
    cell.removeEventListener("click", clickCell);
  });
  document.querySelector("#finish-game").addEventListener("click", () => {
    console.log("clicked finish game button");
    socket.emit("finish", "", (error) => {
      if (error) {
        showError(error, $errorMessage);
      } else {
        console.log("i must go a way");
        window.location.href = "index.html";
      }
    });
  });

  document
    .querySelector("#continue-game")
    .addEventListener("click", continueButtonListener);
});

socket.on("otherUserDecision", (data) => {
  console.log("other user decisition", data);
  if (data.decision == "continue") {
    $gameMessage.innerHTML = "the other user decide to continue :)";
  } else if (data.decision == "end") {
    $gameMessage.innerHTML =
      "the other user decide to finish the game, thanks for playing :)";
    const continueButton = document.querySelector("#continue-game");
    if (continueButton) {
      continueButton.removeEventListener("click", continueButtonListener);
    }
  }
});

$myform.addEventListener("submit", (e) => {
  e.preventDefault();
  $formError.innerHTML = "";
  console.log("my data", myData);
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

    console.log("message delivered");
  });
});
