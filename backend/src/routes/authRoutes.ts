import { Router } from "express";
import { register, login } from "../controllers/authController";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { findUserById } from "../models/userModel";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ id: user.id, name: user.name, email: user.email });
});

export default router;
