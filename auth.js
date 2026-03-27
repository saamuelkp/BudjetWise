const btnShowLogin = document.getElementById("btnShowLogin");
const btnShowRegister = document.getElementById("btnShowRegister");
const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const messageBox = document.getElementById("messageBox");

function showMessage(message, type = "success") {
  messageBox.textContent = message;
  messageBox.className = `message-box ${type}`;
}

function clearMessage() {
  messageBox.textContent = "";
  messageBox.className = "message-box";
}

function switchToLogin() {
  btnShowLogin.classList.add("active");
  btnShowRegister.classList.remove("active");
  loginSection.classList.remove("hidden");
  registerSection.classList.add("hidden");
  clearMessage();
}

function switchToRegister() {
  btnShowRegister.classList.add("active");
  btnShowLogin.classList.remove("active");
  registerSection.classList.remove("hidden");
  loginSection.classList.add("hidden");
  clearMessage();
}

btnShowLogin.addEventListener("click", switchToLogin);
btnShowRegister.addEventListener("click", switchToRegister);

registerForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const salary = parseFloat(document.getElementById("registerSalary").value);

  const result = await API.register({ name, email, password, salary });

  if (!result.ok) {
    showMessage(result.message, "error");
    return;
  }

  showMessage(result.message, "success");
  registerForm.reset();
  switchToLogin();
});

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const result = await API.login({ email, password });

  if (!result.ok) {
    showMessage(result.message, "error");
    return;
  }

  window.location.href = "dashboard.html";
});