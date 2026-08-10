import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createTransaction,
  getTransactionsByUser,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../models/transactionModel";
import { getCategoryById } from "../models/categoryModel";

function isValidType(type: unknown): type is "income" | "expense" {
  return type === "income" || type === "expense";
}

async function parseAndValidateBody(userId: number, body: any) {
  const { categoryId, type, amount, description, occurredOn } = body;

  if (!isValidType(type)) {
    return { error: "type must be 'income' or 'expense'" };
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { error: "amount must be a positive number" };
  }

  let resolvedCategoryId: number | null = null;
  if (categoryId !== undefined && categoryId !== null) {
    const category = await getCategoryById(userId, Number(categoryId));
    if (!category) {
      return { error: "categoryId does not refer to an existing category" };
    }
    resolvedCategoryId = category.id;
  }

  return {
    categoryId: resolvedCategoryId,
    type,
    amount: numericAmount,
    description: description ?? null,
    occurredOn: occurredOn ?? undefined,
  };
}

export async function listTransactions(req: AuthRequest, res: Response) {
  const { type, categoryId, from, to } = req.query;

  if (type !== undefined && !isValidType(type)) {
    return res.status(400).json({ error: "type must be 'income' or 'expense'" });
  }

  const transactions = await getTransactionsByUser(req.userId!, {
    type: type as "income" | "expense" | undefined,
    categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
    from: from as string | undefined,
    to: to as string | undefined,
  });
  res.json(transactions);
}

export async function createTransactionHandler(req: AuthRequest, res: Response) {
  const parsed = await parseAndValidateBody(req.userId!, req.body);
  if ("error" in parsed) {
    return res.status(400).json({ error: parsed.error });
  }

  const transaction = await createTransaction(
    req.userId!,
    parsed.categoryId,
    parsed.type,
    parsed.amount,
    parsed.description,
    parsed.occurredOn
  );
  res.status(201).json(transaction);
}

export async function updateTransactionHandler(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);

  const existing = await getTransactionById(req.userId!, id);
  if (!existing) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  const parsed = await parseAndValidateBody(req.userId!, req.body);
  if ("error" in parsed) {
    return res.status(400).json({ error: parsed.error });
  }

  const transaction = await updateTransaction(
    req.userId!,
    id,
    parsed.categoryId,
    parsed.type,
    parsed.amount,
    parsed.description,
    parsed.occurredOn
  );
  res.json(transaction);
}

export async function deleteTransactionHandler(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);

  const existing = await getTransactionById(req.userId!, id);
  if (!existing) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  await deleteTransaction(req.userId!, id);
  res.status(204).send();
}
