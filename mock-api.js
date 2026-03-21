const MockAPI = {
    getUsers() {
      return JSON.parse(localStorage.getItem("bw_users")) || [];
    },
  
    saveUsers(users) {
      localStorage.setItem("bw_users", JSON.stringify(users));
    },
  
    getTransactions() {
      return JSON.parse(localStorage.getItem("bw_transactions")) || [];
    },
  
    saveTransactions(transactions) {
      localStorage.setItem("bw_transactions", JSON.stringify(transactions));
    },
  
    register({ name, email, password, salary }) {
      const users = this.getUsers();
  
      const existingUser = users.find(
        user => user.email.toLowerCase() === email.toLowerCase()
      );
  
      if (existingUser) {
        return { ok: false, message: "Email déjà utilisé." };
      }
  
      const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        salary: Number(salary)
      };
  
      users.push(newUser);
      this.saveUsers(users);
  
      return { ok: true, message: "Compte créé avec succès." };
    },
  
    login({ email, password }) {
      const users = this.getUsers();
  
      const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
  
      if (!user) {
        return { ok: false, message: "Email ou mot de passe incorrect." };
      }
  
      const fakeToken = "mock-token-" + user.id;
  
      localStorage.setItem("budgetwise_token", fakeToken);
      localStorage.setItem("budgetwise_user_id", String(user.id));
      localStorage.setItem("budgetwise_name", user.name);
      localStorage.setItem("budgetwise_email", user.email);
  
      return {
        ok: true,
        token: fakeToken,
        name: user.name
      };
    },
  
    getCurrentUser() {
      const userId = Number(localStorage.getItem("budgetwise_user_id"));
      if (!userId) return null;
  
      const users = this.getUsers();
      return users.find(user => user.id === userId) || null;
    },
  
    addTransaction({ amount, category, description }) {
      const currentUser = this.getCurrentUser();
  
      if (!currentUser) {
        return { ok: false, message: "Utilisateur non connecté." };
      }
  
      const transactions = this.getTransactions();
  
      const newTransaction = {
        id: Date.now(),
        user_id: currentUser.id,
        amount: Number(amount),
        category,
        description,
        date: new Date().toISOString()
      };
  
      transactions.push(newTransaction);
      this.saveTransactions(transactions);
  
      return { ok: true, message: "Dépense ajoutée." };
    },
  
    getUserTransactions() {
      const currentUser = this.getCurrentUser();
  
      if (!currentUser) {
        return [];
      }
  
      const transactions = this.getTransactions();
  
      return transactions.filter(
        transaction => transaction.user_id === currentUser.id
      );
    },
  
    getDashboard() {
      const currentUser = this.getCurrentUser();
  
      if (!currentUser) {
        return null;
      }
  
      const transactions = this.getUserTransactions();
      const salary = Number(currentUser.salary || 0);
  
      let totalExpenses = 0;
      const expensesByCategory = {};
  
      transactions.forEach(transaction => {
        totalExpenses += Number(transaction.amount || 0);
  
        if (!expensesByCategory[transaction.category]) {
          expensesByCategory[transaction.category] = 0;
        }
  
        expensesByCategory[transaction.category] += Number(transaction.amount || 0);
      });
  
      const remainingBudget = salary - totalExpenses;
  
      const alerts = [];
      Object.keys(expensesByCategory).forEach(category => {
        if (expensesByCategory[category] > salary * 0.3) {
          alerts.push(
            `Attention : tu dépenses beaucoup en ${category} (${expensesByCategory[category].toFixed(2)} $).`
          );
        }
      });
  
      return {
        salary,
        total_expenses: totalExpenses,
        remaining_budget: remainingBudget,
        expenses_by_category: expensesByCategory,
        alerts
      };
    },
  
    logout() {
      localStorage.removeItem("budgetwise_token");
      localStorage.removeItem("budgetwise_user_id");
      localStorage.removeItem("budgetwise_name");
      localStorage.removeItem("budgetwise_email");
    },
  
    resetAll() {
      localStorage.removeItem("bw_users");
      localStorage.removeItem("bw_transactions");
      localStorage.removeItem("budgetwise_token");
      localStorage.removeItem("budgetwise_user_id");
      localStorage.removeItem("budgetwise_name");
      localStorage.removeItem("budgetwise_email");
    }
  };