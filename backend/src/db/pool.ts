import { Pool, types } from "pg";

// Return DATE columns as plain "YYYY-MM-DD" strings instead of JS Date objects,
// which pg would otherwise construct at local midnight and shift when serialized to UTC.
types.setTypeParser(types.builtins.DATE, (value) => value);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
