import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  listCategories,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from "../controllers/categoryController";

const router = Router();

router.use(requireAuth);

router.get("/", listCategories);
router.post("/", createCategoryHandler);
router.put("/:id", updateCategoryHandler);
router.delete("/:id", deleteCategoryHandler);

export default router;
