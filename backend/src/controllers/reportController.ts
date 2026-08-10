import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getSummary, getSpendByCategory, getTrend } from "../models/reportModel";
import { normalizeMonth } from "../models/budgetModel";

function isValidType(type: unknown): type is "income" | "expense" {
  return type === "income" || type === "expense";
}

export async function summaryHandler(req: AuthRequest, res: Response) {
  let month: string | undefined;
  try {
    month = req.query.month ? normalizeMonth(String(req.query.month)) : undefined;
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }

  const summary = await getSummary(req.userId!, month);
  res.json(summary);
}

export async function byCategoryHandler(req: AuthRequest, res: Response) {
  const { type } = req.query;

  if (type !== undefined && !isValidType(type)) {
    return res.status(400).json({ error: "type must be 'income' or 'expense'" });
  }

  let month: string | undefined;
  try {
    month = req.query.month ? normalizeMonth(String(req.query.month)) : undefined;
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }

  const breakdown = await getSpendByCategory(req.userId!, month, type as "income" | "expense" | undefined);
  res.json(breakdown);
}

export async function trendHandler(req: AuthRequest, res: Response) {
  const { from, to } = req.query;
  const trend = await getTrend(req.userId!, from as string | undefined, to as string | undefined);
  res.json(trend);
}
