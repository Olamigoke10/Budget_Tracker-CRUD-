import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  listTransactions,
  createTransactionHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
} from "../controllers/transactionController";

const router = Router();

router.use(requireAuth);

router.get("/", listTransactions);
router.post("/", createTransactionHandler);
router.put("/:id", updateTransactionHandler);
router.delete("/:id", deleteTransactionHandler);

export default router;
