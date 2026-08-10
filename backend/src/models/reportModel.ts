import { pool } from "../db/pool";

export interface Summary {
  income: string;
  expense: string;
  balance: string;
}

export interface CategoryBreakdown {
  category_id: number;
  category_name: string;
  type: "income" | "expense";
  total: string;
}

export interface TrendPoint {
  month: string;
  income: string;
  expense: string;
}

export async function getSummary(userId: number, month?: string): Promise<Summary> {
  const conditions: string[] = ["user_id = $1"];
  const params: unknown[] = [userId];

  if (month) {
    params.push(month);
    conditions.push(`occurred_on >= $${params.length}`);
    params.push(month);
    conditions.push(`occurred_on < ($${params.length}::date + INTERVAL '1 month')`);
  }

  const result = await pool.query<{ income: string; expense: string }>(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
       COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
     FROM transactions
     WHERE ${conditions.join(" AND ")}`,
    params
  );

  const { income, expense } = result.rows[0];
  const balance = (Number(income) - Number(expense)).toFixed(2);
  return { income, expense, balance };
}

export async function getSpendByCategory(
  userId: number,
  month?: string,
  type?: "income" | "expense"
): Promise<CategoryBreakdown[]> {
  const conditions: string[] = ["c.user_id = $1"];
  const params: unknown[] = [userId];

  if (type) {
    params.push(type);
    conditions.push(`c.type = $${params.length}`);
  }

  let transactionDateFilter = "";
  if (month) {
    params.push(month);
    const p1 = params.length;
    params.push(month);
    const p2 = params.length;
    transactionDateFilter = ` AND t.occurred_on >= $${p1} AND t.occurred_on < ($${p2}::date + INTERVAL '1 month')`;
  }

  const result = await pool.query<CategoryBreakdown>(
    `SELECT c.id AS category_id, c.name AS category_name, c.type,
            COALESCE(SUM(t.amount), 0) AS total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = c.user_id${transactionDateFilter}
     WHERE ${conditions.join(" AND ")}
     GROUP BY c.id, c.name, c.type
     ORDER BY total DESC`,
    params
  );
  return result.rows;
}

export async function getTrend(userId: number, from?: string, to?: string): Promise<TrendPoint[]> {
  const conditions: string[] = ["user_id = $1"];
  const params: unknown[] = [userId];

  if (from) {
    params.push(from);
    conditions.push(`occurred_on >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`occurred_on <= $${params.length}`);
  }

  const result = await pool.query<TrendPoint>(
    `SELECT to_char(date_trunc('month', occurred_on), 'YYYY-MM') AS month,
            COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
            COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
     FROM transactions
     WHERE ${conditions.join(" AND ")}
     GROUP BY date_trunc('month', occurred_on)
     ORDER BY date_trunc('month', occurred_on)`,
    params
  );
  return result.rows;
}
