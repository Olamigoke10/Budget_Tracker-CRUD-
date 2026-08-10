import { api } from "./client";

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  category_name: string;
  month: string;
  limit_amount: string;
  spent: string;
  created_at: string;
}

export async function listBudgets(month?: string): Promise<Budget[]> {
  const { data } = await api.get<Budget[]>("/budgets", { params: { month } });
  return data;
}

export async function createBudget(categoryId: number, month: string, limitAmount: number): Promise<Budget> {
  const { data } = await api.post<Budget>("/budgets", { categoryId, month, limitAmount });
  return data;
}

export async function updateBudget(id: number, limitAmount: number): Promise<Budget> {
  const { data } = await api.put<Budget>(`/budgets/${id}`, { limitAmount });
  return data;
}

export async function deleteBudget(id: number): Promise<void> {
  await api.delete(`/budgets/${id}`);
}
