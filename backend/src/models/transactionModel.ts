import { pool } from "../db/pool";

export interface Transaction {
  id: number;
  user_id: number;
  category_id: number | null;
  type: "income" | "expense";
  amount: string;
  description: string | null;
  occurred_on: string;
  created_at: Date;
}

export interface TransactionFilters {
  type?: "income" | "expense";
  categoryId?: number;
  from?: string;
  to?: string;
}

export async function createTransaction(
  userId: number,
  categoryId: number | null,
  type: "income" | "expense",
  amount: number,
  description: string | null,
  occurredOn: string | undefined
): Promise<Transaction> {
  const result = await pool.query<Transaction>(
    `INSERT INTO transactions (user_id, category_id, type, amount, description, occurred_on)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE))
     RETURNING id, user_id, category_id, type, amount, description, occurred_on, created_at`,
    [userId, categoryId, type, amount, description, occurredOn]
  );
  return result.rows[0];
}

export async function getTransactionsByUser(userId: number, filters: TransactionFilters): Promise<Transaction[]> {
  const conditions: string[] = ["user_id = $1"];
  const params: unknown[] = [userId];

  if (filters.type) {
    params.push(filters.type);
    conditions.push(`type = $${params.length}`);
  }
  if (filters.categoryId !== undefined) {
    params.push(filters.categoryId);
    conditions.push(`category_id = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    conditions.push(`occurred_on >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    conditions.push(`occurred_on <= $${params.length}`);
  }

  const result = await pool.query<Transaction>(
    `SELECT id, user_id, category_id, type, amount, description, occurred_on, created_at
     FROM transactions
     WHERE ${conditions.join(" AND ")}
     ORDER BY occurred_on DESC, id DESC`,
    params
  );
  return result.rows;
}

export async function getTransactionById(userId: number, id: number): Promise<Transaction | null> {
  const result = await pool.query<Transaction>(
    `SELECT id, user_id, category_id, type, amount, description, occurred_on, created_at
     FROM transactions WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function updateTransaction(
  userId: number,
  id: number,
  categoryId: number | null,
  type: "income" | "expense",
  amount: number,
  description: string | null,
  occurredOn: string | undefined
): Promise<Transaction | null> {
  const result = await pool.query<Transaction>(
    `UPDATE transactions
     SET category_id = $1, type = $2, amount = $3, description = $4, occurred_on = COALESCE($5, occurred_on)
     WHERE id = $6 AND user_id = $7
     RETURNING id, user_id, category_id, type, amount, description, occurred_on, created_at`,
    [categoryId, type, amount, description, occurredOn, id, userId]
  );
  return result.rows[0] ?? null;
}

export async function deleteTransaction(userId: number, id: number): Promise<boolean> {
  const result = await pool.query(`DELETE FROM transactions WHERE id = $1 AND user_id = $2`, [id, userId]);
  return result.rowCount! > 0;
}
