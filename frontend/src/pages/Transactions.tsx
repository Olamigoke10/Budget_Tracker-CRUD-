import { type FormEvent, useEffect, useState } from "react";
import { listCategories, type Category } from "../api/categories";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type Transaction,
} from "../api/transactions";

interface FormState {
  id: number | null;
  categoryId: string;
  type: "income" | "expense";
  amount: string;
  description: string;
  occurredOn: string;
}

const emptyForm: FormState = {
  id: null,
  categoryId: "",
  type: "expense",
  amount: "",
  description: "",
  occurredOn: new Date().toISOString().slice(0, 10),
};

function formatCurrency(value: string): string {
  return `$${Number(value).toFixed(2)}`;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterType, setFilterType] = useState<"" | "income" | "expense">("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  async function loadTransactions() {
    const data = await listTransactions({
      type: filterType || undefined,
      categoryId: filterCategoryId ? Number(filterCategoryId) : undefined,
    });
    setTransactions(data);
  }

  useEffect(() => {
    async function init() {
      try {
        const [cats] = await Promise.all([listCategories(), loadTransactions()]);
        setCategories(cats);
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
      loadTransactions().catch((err) => setError(err.response?.data?.error ?? "Failed to load transactions."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterCategoryId]);

  function startEdit(t: Transaction) {
    setForm({
      id: t.id,
      categoryId: t.category_id ? String(t.category_id) : "",
      type: t.type,
      amount: t.amount,
      description: t.description ?? "",
      occurredOn: t.occurred_on,
    });
  }

  function resetForm() {
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const input = {
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        type: form.type,
        amount: Number(form.amount),
        description: form.description || null,
        occurredOn: form.occurredOn,
      };
      if (form.id) {
        await updateTransaction(form.id, input);
      } else {
        await createTransaction(input);
      }
      resetForm();
      await loadTransactions();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to save transaction.");
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
      await deleteTransaction(id);
      await loadTransactions();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to delete transaction.");
    }
  }

  const formCategories = categories.filter((c) => c.type === form.type);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="transactions-page">
      {error && <p className="auth-error">{error}</p>}

      <form className="transaction-form" onSubmit={handleSubmit}>
        <h2>{form.id ? "Edit transaction" : "Add transaction"}</h2>
        <div className="form-row">
          <label>
            Type
            <select
              value={form.type}
              onChange={(e) => {
                const type = e.target.value as "income" | "expense";
                setForm((prev) => ({ ...prev, type, categoryId: "" }));
              }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <label>
            Category
            <select
              value={form.categoryId}
              onChange={(e) => {
                const categoryId = e.target.value;
                setForm((prev) => ({ ...prev, categoryId }));
              }}
            >
              <option value="">No category</option>
              {formCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => {
                const amount = e.target.value;
                setForm((prev) => ({ ...prev, amount }));
              }}
              required
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.occurredOn}
              onChange={(e) => {
                const occurredOn = e.target.value;
                setForm((prev) => ({ ...prev, occurredOn }));
              }}
              required
            />
          </label>
          <label className="form-row-grow">
            Description
            <input
              type="text"
              value={form.description}
              onChange={(e) => {
                const description = e.target.value;
                setForm((prev) => ({ ...prev, description }));
              }}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {form.id ? "Save changes" : "Add transaction"}
          </button>
          {form.id && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="filters">
        <label>
          Type
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as "" | "income" | "expense")}>
            <option value="">All</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label>
          Category
          <select value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)}>
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {transactions.length === 0 ? (
        <p className="empty-state">No transactions match these filters.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.occurred_on}</td>
                <td>{t.category_id ? categoryById.get(t.category_id)?.name ?? "—" : "—"}</td>
                <td>{t.description || "—"}</td>
                <td className={t.type === "income" ? "income" : "expense"}>
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </td>
                <td className="row-actions">
                  <button type="button" onClick={() => startEdit(t)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(t.id)}>
                    {confirmingId === t.id ? "Confirm delete?" : "Delete"}
                  </button>
                  {confirmingId === t.id && (
                    <button type="button" onClick={() => setConfirmingId(null)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
