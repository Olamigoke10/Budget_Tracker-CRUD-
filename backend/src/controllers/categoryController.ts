import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../utils/AppError";
import { requireFields, assertValidType } from "../utils/validation";
import {
  createCategory,
  getCategoriesByUser,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../models/categoryModel";

export async function listCategories(req: AuthRequest, res: Response) {
  const categories = await getCategoriesByUser(req.userId!);
  res.json(categories);
}

export async function createCategoryHandler(req: AuthRequest, res: Response) {
  requireFields(req.body, ["name", "type"]);
  const { name, type } = req.body;
  assertValidType(type);

  const category = await createCategory(req.userId!, name, type);
  res.status(201).json(category);
}

export async function updateCategoryHandler(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  requireFields(req.body, ["name", "type"]);
  const { name, type } = req.body;
  assertValidType(type);

  const existing = await getCategoryById(req.userId!, id);
  if (!existing) {
    throw new AppError(404, "Category not found");
  }

  const category = await updateCategory(req.userId!, id, name, type);
  res.json(category);
}

export async function deleteCategoryHandler(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);

  const existing = await getCategoryById(req.userId!, id);
  if (!existing) {
    throw new AppError(404, "Category not found");
  }

  await deleteCategory(req.userId!, id);
  res.status(204).send();
}
