const API_URL = "https://budgetwise-production.up.railway.app"; // ← mettez l'URL de Samuel

const API = {

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

  async updateSalary(salaire) {
    const token = localStorage.getItem("budgetwise_token");
    const response = await fetch(`${API_URL}/salaire`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ salaire })
    });
    const data = await response.json();
    if (!response.ok) return { ok: false, message: data.erreur };
    return { ok: true, message: data.message };
  },

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

  async getUserTransactions() {
    const token = localStorage.getItem("budgetwise_token");
    const response = await fetch(`${API_URL}/transactions`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return await response.json();
  },

  async getDashboard() {
    const token = localStorage.getItem("budgetwise_token");
    const response = await fetch(`${API_URL}/dashboard`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) return null;
    return await response.json();
  },

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

  logout() {
    localStorage.removeItem("budgetwise_token");
    localStorage.removeItem("budgetwise_name");
    localStorage.removeItem("budgetwise_email");
  }

};