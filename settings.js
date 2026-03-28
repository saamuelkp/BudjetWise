const token = localStorage.getItem("budgetwise_token");
if (!token) window.location.href = "index.html";

const passwordMessage = document.getElementById("passwordMessage");

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  API.logout();
  window.location.href = "index.html";
});

document.getElementById("savePasswordBtn").addEventListener("click", async () => {
  const oldPassword = document.getElementById("oldPassword").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmNewPassword").value.trim();

  if (!oldPassword || !newPassword || !confirmPassword) {
    passwordMessage.textContent = "Veuillez remplir tous les champs.";
    passwordMessage.className = "message-box error";
    return;
  }

  if (newPassword !== confirmPassword) {
    passwordMessage.textContent = "Les mots de passe ne correspondent pas.";
    passwordMessage.className = "message-box error";
    return;
  }

  if (newPassword.length < 6) {
    passwordMessage.textContent = "Le mot de passe doit contenir au moins 6 caractères.";
    passwordMessage.className = "message-box error";
    return;
  }

  const result = await API.changePassword(oldPassword, newPassword);

  if (!result.ok) {
    passwordMessage.textContent = result.message;
    passwordMessage.className = "message-box error";
    return;
  }

  passwordMessage.textContent = "Mot de passe changé avec succès !";
  passwordMessage.className = "message-box success";
  document.getElementById("oldPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmNewPassword").value = "";
});