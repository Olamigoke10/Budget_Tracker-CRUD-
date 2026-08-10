import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../utils/AppError";
import { assertValidType, assertPositiveNumber } from "../utils/validation";
import {
  createTransaction,
  getTransactionsByUser,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../models/transactionModel";
import { getCategoryById } from "../models/categoryModel";

async function parseBody(userId: number, body: any) {
  const { categoryId, type, amount, description, occurredOn } = body;

  assertValidType(type);
  const numericAmount = assertPositiveNumber(amount, "amount");

  let resolvedCategoryId: number | null = null;
  if (categoryId !== undefined && categoryId !== null) {
    const category = await getCategoryById(userId, Number(categoryId));
    if (!category) {
      throw new AppError(400, "categoryId does not refer to an existing category");
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

  if (type !== undefined) {
    assertValidType(type);
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
  const parsed = await parseBody(req.userId!, req.body);

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
    throw new AppError(404, "Transaction not found");
  }

  const parsed = await parseBody(req.userId!, req.body);

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
    throw new AppError(404, "Transaction not found");
  }

  await deleteTransaction(req.userId!, id);
  res.status(204).send();
}
