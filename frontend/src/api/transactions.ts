import { api } from "./client";

export interface Transaction {
  id: number;
  user_id: number;
  category_id: number | null;
  type: "income" | "expense";
  amount: string;
  description: string | null;
  occurred_on: string;
  created_at: string;
}

export interface TransactionFilters {
  type?: "income" | "expense";
  categoryId?: number;
  from?: string;
  to?: string;
}

export async function listTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>("/transactions", { params: filters });
  return data;
}

export interface TransactionInput {
  categoryId?: number | null;
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  occurredOn?: string;
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/transactions", input);
  return data;
}

export async function updateTransaction(id: number, input: TransactionInput): Promise<Transaction> {
  const { data } = await api.put<Transaction>(`/transactions/${id}`, input);
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await api.delete(`/transactions/${id}`);
}
