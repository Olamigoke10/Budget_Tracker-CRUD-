import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createBudget,
  getBudgetsByUser,
  getBudgetById,
  getBudgetByCategoryAndMonth,
  updateBudget,
  deleteBudget,
  normalizeMonth,
} from "../models/budgetModel";
import { getCategoryById } from "../models/categoryModel";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function listBudgets(req: AuthRequest, res: Response) {
  let month: string;
  try {
    month = req.query.month ? normalizeMonth(String(req.query.month)) : currentMonth();
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }

  const budgets = await getBudgetsByUser(req.userId!, month);
  res.json(budgets);
}

export async function createBudgetHandler(req: AuthRequest, res: Response) {
  const { categoryId, month, limitAmount } = req.body;

  if (categoryId === undefined || !month || limitAmount === undefined) {
    return res.status(400).json({ error: "categoryId, month, and limitAmount are required" });
  }

  const numericLimit = Number(limitAmount);
  if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
    return res.status(400).json({ error: "limitAmount must be a positive number" });
  }

  let normalizedMonth: string;
  try {
    normalizedMonth = normalizeMonth(String(month));
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }

  const category = await getCategoryById(req.userId!, Number(categoryId));
  if (!category) {
    return res.status(400).json({ error: "categoryId does not refer to an existing category" });
  }
  if (category.type !== "expense") {
    return res.status(400).json({ error: "Budgets can only be set on expense categories" });
  }

  const existing = await getBudgetByCategoryAndMonth(req.userId!, category.id, normalizedMonth);
  if (existing) {
    return res.status(409).json({ error: "A budget already exists for this category and month" });
  }

  const budget = await createBudget(req.userId!, category.id, normalizedMonth, numericLimit);
  res.status(201).json(budget);
}

export async function updateBudgetHandler(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const { limitAmount } = req.body;

  const numericLimit = Number(limitAmount);
  if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
    return res.status(400).json({ error: "limitAmount must be a positive number" });
  }

  const existing = await getBudgetById(req.userId!, id);
  if (!existing) {
    return res.status(404).json({ error: "Budget not found" });
  }

  const budget = await updateBudget(req.userId!, id, numericLimit);
  res.json(budget);
}

export async function deleteBudgetHandler(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);

  const existing = await getBudgetById(req.userId!, id);
  if (!existing) {
    return res.status(404).json({ error: "Budget not found" });
  }

  await deleteBudget(req.userId!, id);
  res.status(204).send();
}
