const API_URL = "https://budjetwise-production.up.railway.app"; // ← remplacer ici

const API = {

  // REGISTER
  async register({ name, email, password, salary }) {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, salary })
    });
    const data = await response.json();
    if (!response.ok) return { ok: false, message: data.erreur };
    return { ok: true, message: data.message };
  },

  // LOGIN
  async login({ email, password }) {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) return { ok: false, message: data.erreur };

    localStorage.setItem("budgetwise_token", data.token);
    localStorage.setItem("budgetwise_name", data.name);
    localStorage.setItem("budgetwise_email", data.email);

    return { ok: true, token: data.token, name: data.name };
  },

  // ADD TRANSACTION
  async addTransaction({ amount, category, description }) {
    const token = localStorage.getItem("budgetwise_token");
    const response = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ amount, category, description })
    });
    const data = await response.json();
    if (!response.ok) return { ok: false, message: data.erreur };
    return { ok: true, message: data.message };
  },

  // GET TRANSACTIONS
  async getUserTransactions() {
    const token = localStorage.getItem("budgetwise_token");
    const response = await fetch(`${API_URL}/transactions`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return await response.json();
  },

  // GET DASHBOARD
  async getDashboard() {
    const token = localStorage.getItem("budgetwise_token");
    const response = await fetch(`${API_URL}/dashboard`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) return null;
    return await response.json();
  },

  // DELETE TRANSACTION
  async deleteTransaction(id) {
    const token = localStorage.getItem("budgetwise_token");
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) return { ok: false, message: data.erreur };
    return { ok: true, message: data.message };
  },

  // LOGOUT
  logout() {
    localStorage.removeItem("budgetwise_token");
    localStorage.removeItem("budgetwise_name");
    localStorage.removeItem("budgetwise_email");
  }

};