import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createCategory,
  getCategoriesByUser,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../models/categoryModel";

function isValidType(type: unknown): type is "income" | "expense" {
  return type === "income" || type === "expense";
}

export async function listCategories(req: AuthRequest, res: Response) {
  const categories = await getCategoriesByUser(req.userId!);
  res.json(categories);
}

export async function createCategoryHandler(req: AuthRequest, res: Response) {
  const { name, type } = req.body;

  if (!name || !isValidType(type)) {
    return res.status(400).json({ error: "name is required and type must be 'income' or 'expense'" });
  }

  const category = await createCategory(req.userId!, name, type);
  res.status(201).json(category);
}

export async function updateCategoryHandler(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const { name, type } = req.body;

  if (!name || !isValidType(type)) {
    return res.status(400).json({ error: "name is required and type must be 'income' or 'expense'" });
  }

  const existing = await getCategoryById(req.userId!, id);
  if (!existing) {
    return res.status(404).json({ error: "Category not found" });
  }

  const category = await updateCategory(req.userId!, id, name, type);
  res.json(category);
}

export async function deleteCategoryHandler(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);

  const existing = await getCategoryById(req.userId!, id);
  if (!existing) {
    return res.status(404).json({ error: "Category not found" });
  }

  await deleteCategory(req.userId!, id);
  res.status(204).send();
}
