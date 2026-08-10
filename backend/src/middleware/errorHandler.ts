import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof SyntaxError && "status" in err && (err as any).status === 400 && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON body" });
  }

  const pgErr = err as { code?: string };
  if (pgErr?.code === "23505") {
    return res.status(409).json({ error: "Resource already exists" });
  }
  if (pgErr?.code === "23503") {
    return res.status(400).json({ error: "Referenced resource does not exist" });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
