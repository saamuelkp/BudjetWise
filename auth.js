// Remplace MockAPI.register(...) par API.register(...)
// Remplace MockAPI.login(...)    par API.login(...)

registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const salary = parseFloat(document.getElementById("registerSalary").value);
  
    const result = await API.register({ name, email, password, salary });
    if (!result.ok) { showMessage(result.message, "error"); return; }
    showMessage(result.message, "success");
    registerForm.reset();
    switchToLogin();
  });
  
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
  
    const result = await API.login({ email, password });
    if (!result.ok) { showMessage(result.message, "error"); return; }
    window.location.href = "dashboard.html";
  });