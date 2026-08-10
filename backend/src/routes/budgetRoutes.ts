import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  listBudgets,
  createBudgetHandler,
  updateBudgetHandler,
  deleteBudgetHandler,
} from "../controllers/budgetController";

const router = Router();

router.use(requireAuth);

router.get("/", listBudgets);
router.post("/", createBudgetHandler);
router.put("/:id", updateBudgetHandler);
router.delete("/:id", deleteBudgetHandler);

export default router;
