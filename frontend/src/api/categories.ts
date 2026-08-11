import { api } from "./client";

export interface Category {
  id: number;
  user_id: number;
  name: string;
  type: "income" | "expense";
  created_at: string;
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function createCategory(name: string, type: "income" | "expense"): Promise<Category> {
  const { data } = await api.post<Category>("/categories", { name, type });
  return data;
}

export async function updateCategory(id: number, name: string, type: "income" | "expense"): Promise<Category> {
  const { data } = await api.put<Category>(`/categories/${id}`, { name, type });
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}
