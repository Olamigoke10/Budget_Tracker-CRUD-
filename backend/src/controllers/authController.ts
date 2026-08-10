import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../models/userModel";
import { AppError } from "../utils/AppError";
import { requireFields } from "../utils/validation";

const SALT_ROUNDS = 10;

function signToken(userId: number): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export async function register(req: Request, res: Response) {
  requireFields(req.body, ["name", "email", "password"]);
  const { name, email, password } = req.body;

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser(name, email, passwordHash);
  const token = signToken(user.id);

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
}

export async function login(req: Request, res: Response) {
  requireFields(req.body, ["email", "password"]);
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = signToken(user.id);

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
}
