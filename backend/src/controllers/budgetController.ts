import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../utils/AppError";
import { requireFields, assertPositiveNumber, normalizeMonth } from "../utils/validation";
import {
  createBudget,
  getBudgetsByUser,
  getBudgetById,
  getBudgetByCategoryAndMonth,
  updateBudget,
  deleteBudget,
} from "../models/budgetModel";
import { getCategoryById } from "../models/categoryModel";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function listBudgets(req: AuthRequest, res: Response) {
  const month = req.query.month ? normalizeMonth(String(req.query.month)) : currentMonth();
  const budgets = await getBudgetsByUser(req.userId!, month);
  res.json(budgets);
}

export async function createBudgetHandler(req: AuthRequest, res: Response) {
  requireFields(req.body, ["categoryId", "month", "limitAmount"]);
  const { categoryId, month, limitAmount } = req.body;

  const numericLimit = assertPositiveNumber(limitAmount, "limitAmount");
  const normalizedMonth = normalizeMonth(String(month));

  const category = await getCategoryById(req.userId!, Number(categoryId));
  if (!category) {
    throw new AppError(400, "categoryId does not refer to an existing category");
  }
  if (category.type !== "expense") {
    throw new AppError(400, "Budgets can only be set on expense categories");
  }

  const existing = await getBudgetByCategoryAndMonth(req.userId!, category.id, normalizedMonth);
  if (existing) {
    throw new AppError(409, "A budget already exists for this category and month");
  }

  const budget = await createBudget(req.userId!, category.id, normalizedMonth, numericLimit);
  res.status(201).json(budget);
}

export async function updateBudgetHandler(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  requireFields(req.body, ["limitAmount"]);
  const numericLimit = assertPositiveNumber(req.body.limitAmount, "limitAmount");

  const existing = await getBudgetById(req.userId!, id);
  if (!existing) {
    throw new AppError(404, "Budget not found");
  }

  const budget = await updateBudget(req.userId!, id, numericLimit);
  res.json(budget);
}

export async function deleteBudgetHandler(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);

  const existing = await getBudgetById(req.userId!, id);
  if (!existing) {
    throw new AppError(404, "Budget not found");
  }

  await deleteBudget(req.userId!, id);
  res.status(204).send();
}
