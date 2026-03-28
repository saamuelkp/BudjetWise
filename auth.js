const btnShowLogin = document.getElementById("btnShowLogin");
const btnShowRegister = document.getElementById("btnShowRegister");
const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");
const forgotSection = document.getElementById("forgotSection");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotForm = document.getElementById("forgotForm");
const messageBox = document.getElementById("messageBox");
const forgotBtn = document.getElementById("forgotBtn");
const backToLoginBtn = document.getElementById("backToLoginBtn");

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
  forgotSection.classList.add("hidden");
  clearMessage();
}

function switchToRegister() {
  btnShowRegister.classList.add("active");
  btnShowLogin.classList.remove("active");
  registerSection.classList.remove("hidden");
  loginSection.classList.add("hidden");
  forgotSection.classList.add("hidden");
  clearMessage();
}

btnShowLogin.addEventListener("click", switchToLogin);
btnShowRegister.addEventListener("click", switchToRegister);

forgotBtn.addEventListener("click", () => {
  loginSection.classList.add("hidden");
  forgotSection.classList.remove("hidden");
  clearMessage();
});

backToLoginBtn.addEventListener("click", () => {
  forgotSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
  clearMessage();
});

forgotForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const email = document.getElementById("forgotEmail").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmNewPassword = document.getElementById("confirmNewPassword").value.trim();

  if (newPassword !== confirmNewPassword) {
    showMessage("Les mots de passe ne correspondent pas.", "error");
    return;
  }

  if (newPassword.length < 6) {
    showMessage("Le mot de passe doit contenir au moins 6 caractères.", "error");
    return;
  }

  const result = await API.resetPassword(email, newPassword);

  if (!result.ok) {
    showMessage(result.message, "error");
    return;
  }

  showMessage("Mot de passe réinitialisé avec succès !", "success");
  forgotForm.reset();
  forgotSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
});

registerForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const confirmPassword = document.getElementById("registerConfirmPassword").value.trim();
  const salary = parseFloat(document.getElementById("registerSalary").value);

  if (password !== confirmPassword) {
    showMessage("Les mots de passe ne correspondent pas.", "error");
    return;
  }

  if (password.length < 6) {
    showMessage("Le mot de passe doit contenir au moins 6 caractères.", "error");
    return;
  }

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