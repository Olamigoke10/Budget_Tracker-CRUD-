import { type FormEvent, useEffect, useState } from "react";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "../api/categories";

interface FormState {
  id: number | null;
  name: string;
  type: "income" | "expense";
}

const emptyForm: FormState = { id: null, name: "", type: "expense" };

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  async function loadCategories() {
    const data = await listCategories();
    setCategories(data);
  }

  useEffect(() => {
    loadCategories()
      .catch((err) => setError(err.response?.data?.error ?? "Failed to load categories."))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(c: Category) {
    setForm({ id: c.id, name: c.name, type: c.type });
  }

  function resetForm() {
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (form.id) {
        await updateCategory(form.id, form.name, form.type);
      } else {
        await createCategory(form.name, form.type);
      }
      resetForm();
      await loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to save category.");
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
      await deleteCategory(id);
      await loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to delete category.");
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="transactions-page">
      {error && <p className="auth-error">{error}</p>}

      <form className="transaction-form" onSubmit={handleSubmit}>
        <h2>{form.id ? "Edit category" : "Add category"}</h2>
        <div className="form-row">
          <label className="form-row-grow">
            Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({ ...prev, name }));
              }}
              required
            />
          </label>
          <label>
            Type
            <select
              value={form.type}
              onChange={(e) => {
                const type = e.target.value as "income" | "expense";
                setForm((prev) => ({ ...prev, type }));
              }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {form.id ? "Save changes" : "Add category"}
          </button>
          {form.id && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {categories.length === 0 ? (
        <p className="empty-state">No categories yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className={c.type === "income" ? "income" : "expense"}>{c.type}</td>
                <td className="row-actions">
                  <button type="button" onClick={() => startEdit(c)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(c.id)}>
                    {confirmingId === c.id ? "Confirm delete?" : "Delete"}
                  </button>
                  {confirmingId === c.id && (
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
