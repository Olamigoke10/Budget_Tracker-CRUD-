import { useEffect, useState } from "react";
import { getSummary, type Summary } from "../api/reports";
import { listBudgets, type Budget } from "../api/budgets";
import { listTransactions, type Transaction } from "../api/transactions";

function formatCurrency(value: string): string {
  return `$${Number(value).toFixed(2)}`;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [summaryData, budgetsData, transactionsData] = await Promise.all([
          getSummary(),
          listBudgets(),
          listTransactions(),
        ]);
        setSummary(summaryData);
        setBudgets(budgetsData);
        setRecentTransactions(transactionsData.slice(0, 5));
      } catch (err: any) {
        setError(err.response?.data?.error ?? "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="auth-error">{error}</p>;
  }

  return (
    <div className="dashboard">
      <section className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Income</span>
          <span className="summary-value income">{formatCurrency(summary!.income)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Expense</span>
          <span className="summary-value expense">{formatCurrency(summary!.expense)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Balance</span>
          <span className="summary-value">{formatCurrency(summary!.balance)}</span>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Budgets this month</h2>
        {budgets.length === 0 ? (
          <p className="empty-state">No budgets set for this month yet.</p>
        ) : (
          <ul className="budget-list">
            {budgets.map((b) => {
              const spent = Number(b.spent);
              const limit = Number(b.limit_amount);
              const pct = Math.min(100, (spent / limit) * 100);
              const over = spent > limit;
              return (
                <li key={b.id} className="budget-item">
                  <div className="budget-item-header">
                    <span>{b.category_name}</span>
                    <span className={over ? "over-budget" : ""}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit_amount)}
                    </span>
                  </div>
                  <div className="budget-bar">
                    <div
                      className={`budget-bar-fill${over ? " over" : ""}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="dashboard-section">
        <h2>Recent transactions</h2>
        {recentTransactions.length === 0 ? (
          <p className="empty-state">No transactions yet.</p>
        ) : (
          <ul className="transaction-list">
            {recentTransactions.map((t) => (
              <li key={t.id} className="transaction-item">
                <span>{t.occurred_on}</span>
                <span>{t.description || "—"}</span>
                <span className={t.type === "income" ? "income" : "expense"}>
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
