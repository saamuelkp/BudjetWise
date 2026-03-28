const API_URL = "https://budjetwise-production.up.railway.app";

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

  async resetPassword(email, newPassword) {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: newPassword })
    });
    const data = await response.json();
    if (!response.ok) return { ok: false, message: data.erreur };
    return { ok: true, message: data.message };
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

  async getUserTransactions(mois = null) {
    const token = localStorage.getItem("budgetwise_token");
    const url = mois ? `${API_URL}/transactions?mois=${mois}` : `${API_URL}/transactions`;
    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return await response.json();
  },

  async getDashboard(mois = null) {
    const token = localStorage.getItem("budgetwise_token");
    const url = mois ? `${API_URL}/dashboard?mois=${mois}` : `${API_URL}/dashboard`;
    const response = await fetch(url, {
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

  async getHistorique() {
    const token = localStorage.getItem("budgetwise_token");
    const response = await fetch(`${API_URL}/historique`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) return { mois_disponibles: [] };
    return await response.json();
  },

  async getStatistiques() {
    const token = localStorage.getItem("budgetwise_token");
    const response = await fetch(`${API_URL}/statistiques`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) return null;
    return await response.json();
  },

  logout() {
    localStorage.removeItem("budgetwise_token");
    localStorage.removeItem("budgetwise_name");
    localStorage.removeItem("budgetwise_email");
  }

};