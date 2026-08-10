import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { summaryHandler, byCategoryHandler, trendHandler } from "../controllers/reportController";

const router = Router();

router.use(requireAuth);

router.get("/summary", summaryHandler);
router.get("/by-category", byCategoryHandler);
router.get("/trend", trendHandler);

export default router;
