//dom elements
const $errorMessage = document.querySelector("#error-message");
const $userData = document.querySelector("#user-data");

//templates
const userDataTemplate = document.querySelector(
  "#user-data-template"
).innerHTML;

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
    console.log(user);
    localStorage.setItem("token", user.token);
    const html = Mustache.render(userDataTemplate, {
      nickName: user.nickName,
      fullName: user.fullName,
      credit: user.credit,
    });
    $userData.insertAdjacentHTML("beforebegin", html);
  } catch (error) {
    const errorMessage =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    $errorMessage.innerHTML = errorMessage;
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
    console.log(user);
    const html = Mustache.render(userDataTemplate, {
      nickName: user.nickName,
      fullName: user.fullName,
      credit: user.credit,
    });
    $userData.insertAdjacentHTML("beforebegin", html);
  } catch (error) {
    const errorMessage =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    $errorMessage.innerHTML = errorMessage;
  }
};

const token = localStorage.getItem("token");
if (!token) {
  getTokenAndSetUser();
} else {
  getUserData(token);
}
