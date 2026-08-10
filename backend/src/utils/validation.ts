import { AppError } from "./AppError";

export function requireFields(body: Record<string, unknown>, fields: string[]): void {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === "");
  if (missing.length > 0) {
    throw new AppError(400, `Missing required field(s): ${missing.join(", ")}`);
  }
}

export function assertValidType(type: unknown): asserts type is "income" | "expense" {
  if (type !== "income" && type !== "expense") {
    throw new AppError(400, "type must be 'income' or 'expense'");
  }
}

export function assertPositiveNumber(value: unknown, fieldName: string): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new AppError(400, `${fieldName} must be a positive number`);
  }
  return num;
}

export function normalizeMonth(input: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(input);
  if (!match) {
    throw new AppError(400, "month must be in YYYY-MM or YYYY-MM-DD format");
  }
  return `${match[1]}-${match[2]}-01`;
}
