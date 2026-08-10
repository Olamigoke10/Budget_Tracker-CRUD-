import { pool } from "../db/pool";

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  month: string;
  limit_amount: string;
  created_at: Date;
}

export interface BudgetWithProgress extends Budget {
  category_name: string;
  spent: string;
}

export async function createBudget(
  userId: number,
  categoryId: number,
  month: string,
  limitAmount: number
): Promise<Budget> {
  const result = await pool.query<Budget>(
    `INSERT INTO budgets (user_id, category_id, month, limit_amount)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, category_id, month, limit_amount, created_at`,
    [userId, categoryId, month, limitAmount]
  );
  return result.rows[0];
}

export async function getBudgetsByUser(userId: number, month: string): Promise<BudgetWithProgress[]> {
  const result = await pool.query<BudgetWithProgress>(
    `SELECT
       b.id, b.user_id, b.category_id, b.month, b.limit_amount, b.created_at,
       c.name AS category_name,
       COALESCE(SUM(t.amount) FILTER (
         WHERE t.type = 'expense'
           AND t.occurred_on >= b.month
           AND t.occurred_on < (b.month + INTERVAL '1 month')
       ), 0) AS spent
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     LEFT JOIN transactions t ON t.category_id = b.category_id AND t.user_id = b.user_id
     WHERE b.user_id = $1 AND b.month = $2
     GROUP BY b.id, c.name
     ORDER BY c.name`,
    [userId, month]
  );
  return result.rows;
}

export async function getBudgetById(userId: number, id: number): Promise<Budget | null> {
  const result = await pool.query<Budget>(
    `SELECT id, user_id, category_id, month, limit_amount, created_at
     FROM budgets WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function getBudgetByCategoryAndMonth(
  userId: number,
  categoryId: number,
  month: string
): Promise<Budget | null> {
  const result = await pool.query<Budget>(
    `SELECT id, user_id, category_id, month, limit_amount, created_at
     FROM budgets WHERE user_id = $1 AND category_id = $2 AND month = $3`,
    [userId, categoryId, month]
  );
  return result.rows[0] ?? null;
}

export async function updateBudget(userId: number, id: number, limitAmount: number): Promise<Budget | null> {
  const result = await pool.query<Budget>(
    `UPDATE budgets SET limit_amount = $1 WHERE id = $2 AND user_id = $3
     RETURNING id, user_id, category_id, month, limit_amount, created_at`,
    [limitAmount, id, userId]
  );
  return result.rows[0] ?? null;
}

export async function deleteBudget(userId: number, id: number): Promise<boolean> {
  const result = await pool.query(`DELETE FROM budgets WHERE id = $1 AND user_id = $2`, [id, userId]);
  return result.rowCount! > 0;
}
