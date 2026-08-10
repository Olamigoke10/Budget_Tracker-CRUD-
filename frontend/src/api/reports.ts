import { api } from "./client";

export interface Summary {
  income: string;
  expense: string;
  balance: string;
}

export async function getSummary(month?: string): Promise<Summary> {
  const { data } = await api.get<Summary>("/reports/summary", { params: { month } });
  return data;
}
