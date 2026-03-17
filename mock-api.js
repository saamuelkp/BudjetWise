// =============================================
// CHANGE JUSTE CETTE LIGNE quand Samuel te donne son URL Railway
const BASE_URL = "https://METS-URL-DE-SAMUEL-ICI.up.railway.app";
// =============================================

const API = {

  // ─── AUTH ───────────────────────────────────

  async register({ name, email, password, salary }) {
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, salary: Number(salary) })
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.message || "Erreur inscription." };
      return { ok: true, message: "Compte créé avec succès." };
    } catch (err) {
      return { ok: false, message: "Impossible de contacter le serveur." };
    }
  },

  async login({ email, password }) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.message || "Identifiants incorrects." };

      localStorage.setItem("budgetwise_token", data.token);
      localStorage.setItem("budgetwise_name", data.name);
      localStorage.setItem("budgetwise_user_id", String(data.id || ""));

      return { ok: true, token: data.token, name: data.name };
    } catch (err) {
      return { ok: false, message: "Impossible de contacter le serveur." };
    }
  },

  logout() {
    localStorage.removeItem("budgetwise_token");
    localStorage.removeItem("budgetwise_name");
    localStorage.removeItem("budgetwise_user_id");
  },

  getToken() {
    return localStorage.getItem("budgetwise_token");
  },

  // ─── TRANSACTIONS ────────────────────────────

  async addTransaction({ amount, category, description }) {
    try {
      const res = await fetch(`${BASE_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ amount: Number(amount), category, description })
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.message || "Erreur ajout transaction." };
      return { ok: true, message: "Dépense ajoutée." };
    } catch (err) {
      return { ok: false, message: "Impossible de contacter le serveur." };
    }
  },

  async getUserTransactions() {
    try {
      const res = await fetch(`${BASE_URL}/transactions`, {
        headers: { "Authorization": `Bearer ${this.getToken()}` }
      });
      const data = await res.json();
      if (!res.ok) return [];
      return data.transactions || data || [];
    } catch (err) {
      return [];
    }
  },

  // ─── DASHBOARD ───────────────────────────────

  async getDashboard() {
    try {
      const res = await fetch(`${BASE_URL}/dashboard`, {
        headers: { "Authorization": `Bearer ${this.getToken()}` }
      });
      const data = await res.json();
      if (!res.ok) return null;
      return data;
    } catch (err) {
      return null;
    }
  }
};