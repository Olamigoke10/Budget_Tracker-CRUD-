import { type FormEvent, useEffect, useState } from "react";
import { listCategories, type Category } from "../api/categories";
import { listBudgets, createBudget, updateBudget, deleteBudget, type Budget } from "../api/budgets";

interface FormState {
  id: number | null;
  categoryId: string;
  limitAmount: string;
}

const emptyForm: FormState = { id: null, categoryId: "", limitAmount: "" };

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(value: string): string {
  return `$${Number(value).toFixed(2)}`;
}

export default function Budgets() {
  const [month, setMonth] = useState(currentMonth());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const availableCategories = expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id));

  async function loadBudgets() {
    const data = await listBudgets(month);
    setBudgets(data);
  }

  useEffect(() => {
    async function init() {
      try {
        const cats = await listCategories();
        setCategories(cats);
        await loadBudgets();
      } catch (err: any) {
        setError(err.response?.data?.error ?? "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      loadBudgets().catch((err) => setError(err.response?.data?.error ?? "Failed to load budgets."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function startEdit(b: Budget) {
    setForm({ id: b.id, categoryId: String(b.category_id), limitAmount: b.limit_amount });
  }

  function resetForm() {
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const limitAmount = Number(form.limitAmount);
      if (form.id) {
        await updateBudget(form.id, limitAmount);
      } else {
        await createBudget(Number(form.categoryId), month, limitAmount);
      }
      resetForm();
      await loadBudgets();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to save budget.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    setConfirmingId(null);
    setError(null);
    try {
      await deleteBudget(id);
      await loadBudgets();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to delete budget.");
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="transactions-page">
      {error && <p className="auth-error">{error}</p>}

      <div className="filters">
        <label>
          Month
          <input
            type="month"
            value={month}
            onChange={(e) => {
              const value = e.target.value;
              setMonth(value);
            }}
          />
        </label>
      </div>

      <form className="transaction-form" onSubmit={handleSubmit}>
        <h2>{form.id ? "Edit budget" : "Add budget"}</h2>
        <div className="form-row">
          <label>
            Category
            <select
              value={form.categoryId}
              disabled={!!form.id}
              onChange={(e) => {
                const categoryId = e.target.value;
                setForm((prev) => ({ ...prev, categoryId }));
              }}
              required
            >
              <option value="">Select category</option>
              {(form.id ? expenseCategories : availableCategories).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Monthly limit
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.limitAmount}
              onChange={(e) => {
                const limitAmount = e.target.value;
                setForm((prev) => ({ ...prev, limitAmount }));
              }}
              required
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={saving || (!form.id && availableCategories.length === 0)}>
            {form.id ? "Save changes" : "Add budget"}
          </button>
          {form.id && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
        {!form.id && availableCategories.length === 0 && (
          <p className="empty-state">Every expense category already has a budget for this month.</p>
        )}
      </form>

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
                  <div className={`budget-bar-fill${over ? " over" : ""}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="row-actions budget-actions">
                  <button type="button" onClick={() => startEdit(b)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(b.id)}>
                    {confirmingId === b.id ? "Confirm delete?" : "Delete"}
                  </button>
                  {confirmingId === b.id && (
                    <button type="button" onClick={() => setConfirmingId(null)}>
                      Cancel
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
