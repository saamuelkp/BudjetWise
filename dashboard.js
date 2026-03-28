const token = localStorage.getItem("budgetwise_token");
const userName = localStorage.getItem("budgetwise_name") || "Utilisateur";

if (!token) window.location.href = "index.html";

const welcomeText = document.getElementById("welcomeText");
const salaryValue = document.getElementById("salaryValue");
const expenseValue = document.getElementById("expenseValue");
const remainingValue = document.getElementById("remainingValue");
const alertsList = document.getElementById("alertsList");
const transactionsTableBody = document.getElementById("transactionsTableBody");
const aiTipsBox = document.getElementById("aiTipsBox");
const transactionForm = document.getElementById("transactionForm");
const transactionMessage = document.getElementById("transactionMessage");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const editSalaryBtn = document.getElementById("editSalaryBtn");
const salaryForm = document.getElementById("salaryForm");
const saveSalaryBtn = document.getElementById("saveSalaryBtn");

let categoryChartInstance = null;
let weeklyChartInstance = null;

welcomeText.textContent = `Bienvenue, ${userName}`;

function showTransactionMessage(message, type = "success") {
  transactionMessage.textContent = message;
  transactionMessage.className = `message-box ${type}`;
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

logoutBtn.addEventListener("click", () => {
  API.logout();
  window.location.href = "index.html";
});

refreshBtn.addEventListener("click", loadDashboardData);

editSalaryBtn.addEventListener("click", () => {
  salaryForm.style.display = salaryForm.style.display === "none" ? "block" : "none";
});

saveSalaryBtn.addEventListener("click", async () => {
  const newSalary = parseFloat(document.getElementById("newSalaryInput").value);
  if (!newSalary || newSalary <= 0) return;
  const result = await API.updateSalary(newSalary);
  if (result.ok) {
    salaryForm.style.display = "none";
    loadDashboardData();
  }
});

transactionForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value.trim();
  const result = await API.addTransaction({ amount, category, description });
  if (!result.ok) {
    showTransactionMessage(result.message, "error");
    return;
  }
  showTransactionMessage(result.message, "success");
  transactionForm.reset();
  loadDashboardData();
});

async function deleteTransaction(id) {
  if (!confirm("Supprimer cette dépense ?")) return;
  const result = await API.deleteTransaction(id);
  if (result.ok) loadDashboardData();
}

async function loadDashboardData() {
  const data = await API.getDashboard();
  if (!data) {
    alertsList.innerHTML = "<li>Impossible de charger les données.</li>";
    return;
  }
  salaryValue.textContent = formatMoney(data.salary);
  expenseValue.textContent = formatMoney(data.total_expenses);
  remainingValue.textContent = formatMoney(data.remaining_budget);
  renderAlerts(data.alerts || []);
  renderCategoryChart(data.expenses_by_category || {});
  renderAITips(data);
  const transactions = await API.getUserTransactions();
  renderTransactions(transactions);
  renderWeeklyChart(transactions);
}

function renderAlerts(alerts) {
  if (!alerts.length) {
    alertsList.innerHTML = "<li>Aucune alerte pour le moment.</li>";
    return;
  }
  alertsList.innerHTML = alerts.map(a => `<li>${a}</li>`).join("");
}

function renderTransactions(transactions) {
  if (!transactions.length) {
    transactionsTableBody.innerHTML = `<tr><td colspan="5">Aucune transaction trouvée.</td></tr>`;
    return;
  }
  transactionsTableBody.innerHTML = transactions.map(t => {
    const date = t.date ? new Date(t.date).toLocaleDateString("fr-CA") : "-";
    return `<tr>
      <td>${date}</td>
      <td>${t.category || "-"}</td>
      <td>${t.description || "-"}</td>
      <td>${formatMoney(t.amount)}</td>
      <td><button class="danger-btn" style="font-size:12px;padding:4px 10px;" onclick="deleteTransaction(${t.id})">Supprimer</button></td>
    </tr>`;
  }).join("");
}

function renderCategoryChart(expensesByCategory) {
  const labels = Object.keys(expensesByCategory);
  const values = Object.values(expensesByCategory);
  const ctx = document.getElementById("categoryChart").getContext("2d");
  if (categoryChartInstance) categoryChartInstance.destroy();
  categoryChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels.length ? labels : ["Aucune donnée"],
      datasets: [{
        data: values.length ? values : [1],
        backgroundColor: ["#2563eb","#16a34a","#f59e0b","#dc2626","#7c3aed","#0891b2","#e11d48","#6b7280"]
      }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}

function renderWeeklyChart(transactions) {
  const dailyTotals = {};
  transactions.forEach(t => {
    const date = t.date ? new Date(t.date) : new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    dailyTotals[key] = (dailyTotals[key] || 0) + Number(t.amount || 0);
  });
  const labels = Object.keys(dailyTotals).sort();
  const values = labels.map(l => dailyTotals[l]);
  const ctx = document.getElementById("weeklyChart").getContext("2d");
  if (weeklyChartInstance) weeklyChartInstance.destroy();
  weeklyChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.length ? labels : ["Aucune donnée"],
      datasets: [{
        label: "Dépenses",
        data: values.length ? values : [0],
        borderColor: "#1d4ed8",
        backgroundColor: "rgba(37,99,235,0.2)",
        tension: 0.3,
        fill: true
      }]
    },
    options: { responsive: true }
  });
}

function renderAITips(data) {
  const remaining = Number(data.remaining_budget || 0);
  const totalExpenses = Number(data.total_expenses || 0);
  const categories = data.expenses_by_category || {};
  const tips = [];
  if (remaining < 300) tips.push("Ton budget restant devient faible. Limite les dépenses non essentielles.");
  if (categories["Restaurant"] > 200) tips.push("Tu dépenses beaucoup au restaurant. Réduire cette catégorie t'aiderait.");
  if (categories["Loisirs"] > 150) tips.push("Les loisirs prennent une bonne part du budget.");
  if (totalExpenses === 0) tips.push("Ajoute des dépenses pour recevoir des conseils personnalisés.");
  if (!tips.length) tips.push("Tes dépenses semblent bien réparties. Continue comme ça !");
  aiTipsBox.innerHTML = tips.map(t => `<p>${t}</p>`).join("");
}

loadDashboardData();