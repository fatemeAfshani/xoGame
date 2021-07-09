//dom element
const $errorMessage = document.querySelector("#error-message");
const $boardData = document.querySelector("#board-data");
const $countDown = document.querySelector("#count-down");

//templates
const boardDataTemplate = document.querySelector(
  "#board-data-template"
).innerHTML;

const { id } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
console.log(id);

const showError = (error, domElement) => {
  const errorMessage =
    error.response && error.response.data.message
      ? error.response.data.message
      : error.message;
  domElement.innerHTML = errorMessage;
};

function TimeOutCounter(duration, display) {
  var timer = duration,
    minutes,
    seconds;
  setInterval(function () {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    display.textContent = minutes + ":" + seconds;

    if (--timer < 0) {
      showError({ message: "time out" }, $errorMessage);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 5000);
    }
  }, 1000);
}

const getBoardAndJoinTimeOut = async (token) => {
  try {
    const { data } = await axios.get(`http://localhost:3001/api/game/${id}`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const { user, board, joinTimeOut } = data;
    console.log(data);
    const html = Mustache.render(boardDataTemplate, {
      nickName: user.nickName,
      gem: board.gem,
      credit: user.credit,
    });
    $boardData.innerHTML = html;
    TimeOutCounter(joinTimeOut, $countDown);
  } catch (error) {
    showError(error, $errorMessage);
  }
};

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "index.html";
}
getBoardAndJoinTimeOut(token);

const socket = io("/waiting", {
  extraHeaders: {
    board: id,
  },
});
socket.on("connect", () => {
  console.log("im connected");
});

socket.on("join", () => {
  window.location.href = `playground.html?id=${id}`;
});
