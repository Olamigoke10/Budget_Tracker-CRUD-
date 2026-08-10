import { pool } from "../db/pool";

export interface Category {
  id: number;
  user_id: number;
  name: string;
  type: "income" | "expense";
  created_at: Date;
}

export async function createCategory(userId: number, name: string, type: "income" | "expense"): Promise<Category> {
  const result = await pool.query<Category>(
    `INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3)
     RETURNING id, user_id, name, type, created_at`,
    [userId, name, type]
  );
  return result.rows[0];
}

export async function getCategoriesByUser(userId: number): Promise<Category[]> {
  const result = await pool.query<Category>(
    `SELECT id, user_id, name, type, created_at FROM categories WHERE user_id = $1 ORDER BY name`,
    [userId]
  );
  return result.rows;
}

export async function getCategoryById(userId: number, id: number): Promise<Category | null> {
  const result = await pool.query<Category>(
    `SELECT id, user_id, name, type, created_at FROM categories WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function updateCategory(
  userId: number,
  id: number,
  name: string,
  type: "income" | "expense"
): Promise<Category | null> {
  const result = await pool.query<Category>(
    `UPDATE categories SET name = $1, type = $2 WHERE id = $3 AND user_id = $4
     RETURNING id, user_id, name, type, created_at`,
    [name, type, id, userId]
  );
  return result.rows[0] ?? null;
}

export async function deleteCategory(userId: number, id: number): Promise<boolean> {
  const result = await pool.query(`DELETE FROM categories WHERE id = $1 AND user_id = $2`, [id, userId]);
  return result.rowCount! > 0;
}
