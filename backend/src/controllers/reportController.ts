import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getSummary, getSpendByCategory, getTrend } from "../models/reportModel";
import { normalizeMonth, assertValidType } from "../utils/validation";

export async function summaryHandler(req: AuthRequest, res: Response) {
  const month = req.query.month ? normalizeMonth(String(req.query.month)) : undefined;
  const summary = await getSummary(req.userId!, month);
  res.json(summary);
}

export async function byCategoryHandler(req: AuthRequest, res: Response) {
  const { type } = req.query;
  if (type !== undefined) {
    assertValidType(type);
  }

  const month = req.query.month ? normalizeMonth(String(req.query.month)) : undefined;
  const breakdown = await getSpendByCategory(req.userId!, month, type as "income" | "expense" | undefined);
  res.json(breakdown);
}

export async function trendHandler(req: AuthRequest, res: Response) {
  const { from, to } = req.query;
  const trend = await getTrend(req.userId!, from as string | undefined, to as string | undefined);
  res.json(trend);
}
