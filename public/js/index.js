//dom elements
const $errorMessage = document.querySelector("#error-message");
const $userData = document.querySelector("#user-data");
const $userBoard = document.querySelector("#user-boards");
const $openBoards = document.querySelector("#open-boards");
const $newBoardForm = document.querySelector("#new-board");
const $formButton = $newBoardForm.querySelector("button");
const $formInput = $newBoardForm.querySelector("input");
const $formErrorMessage = document.querySelector("#form-error-message");

//templates
const userDataTemplate = document.querySelector(
  "#user-data-template"
).innerHTML;

const userBoardTemplate = document.querySelector(
  "#user-board-template"
).innerHTML;

const openBoardTemplate = document.querySelector(
  "#open-board-template"
).innerHTML;

const showError = (error, domElement) => {
  const errorMessage =
    error.response && error.response.data.message
      ? error.response.data.message
      : error.message;
  domElement.innerHTML = errorMessage;
};

const getTokenAndSetUser = async () => {
  try {
    const { data: token } = await axios.get(
      "http://localhost:3001/api/user/getUserToken"
    );

    const { data: user } = await axios.get(
      "http://localhost:3001/api/user/login",
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    localStorage.setItem("token", user.token);
    const html = Mustache.render(userDataTemplate, {
      nickName: user.nickName,
      fullName: user.fullName,
      credit: user.credit,
    });
    $userData.insertAdjacentHTML("beforebegin", html);
    getOpenBoards();
  } catch (error) {
    showError(error, $errorMessage);
  }
};

const getUserData = async (token) => {
  try {
    const { data: user } = await axios.get(
      "http://localhost:3001/api/user/me",
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    const html = Mustache.render(userDataTemplate, {
      nickName: user.nickName,
      fullName: user.fullName,
      credit: user.credit,
      avatar: user.avatar,
    });
    $userData.insertAdjacentHTML("beforebegin", html);
  } catch (error) {
    showError(error, $errorMessage);
  }
};

const getUserBoardsHistory = async () => {
  const token = localStorage.getItem("token");
  try {
    const { data: boards } = await axios.get(
      "http://localhost:3001/api/game/mine",
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    const html = Mustache.render(userBoardTemplate, {
      boards,
    });
    $userBoard.innerHTML = html;
  } catch (error) {
    showError(error, $errorMessage);
  }
};

const getOpenBoards = async () => {
  const token = localStorage.getItem("token");
  try {
    const { data: boards } = await axios.get(
      "http://localhost:3001/api/game/open",
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    const html = Mustache.render(openBoardTemplate, {
      boards,
    });
    $openBoards.innerHTML = html;
    setListnerForBoards(token);
  } catch (error) {
    showError(error, $errorMessage);
  }
};

//start
const token = localStorage.getItem("token");
if (!token) {
  getTokenAndSetUser();
} else {
  getUserData(token);
  getUserBoardsHistory();
  getOpenBoards();
}

$newBoardForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  $formButton.setAttribute("disabled", "disabled");

  const gemNumber = e.target.elements.gem.value;

  const token = localStorage.getItem("token");
  try {
    const { data: board } = await axios.post(
      "http://localhost:3001/api/game",
      {
        gem: gemNumber,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    window.location.href = `waiting.html?id=${board._id}`;
  } catch (error) {
    $formButton.removeAttribute("disabled");
    showError(error, $formErrorMessage);
  }
});

setListnerForBoards = (token) => {
  const $boards = document.getElementById("boards").querySelectorAll("li");
  $boards.forEach((board) => {
    const $joinButton = board.querySelector(".join-board");
    $joinButton.addEventListener("click", async () => {
      const id = $joinButton.getAttribute("data-id");

      try {
        const { data: board } = await axios.patch(
          `http://localhost:3001/api/game/join/${id}`,
          {},
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );

        window.location.href = `playground.html?id=${board._id}`;
      } catch (error) {
        showError(error, $errorMessage);
      }
    });
  });
};
