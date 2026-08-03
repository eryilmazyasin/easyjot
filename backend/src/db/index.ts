import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../config/env.js";
import * as schema from "./schema.js";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error: Error) => {
  console.error("Unexpected PostgreSQL pool error.", error);
});

export const db = drizzle(pool, { schema });

export const verifyDatabaseConnection = async (): Promise<void> => {
  await pool.query("select 1");
};

export const isDatabaseReady = async (): Promise<boolean> => {
  try {
    await verifyDatabaseConnection();
    return true;
  } catch {
    return false;
  }
};

export const closeDatabase = async (): Promise<void> => {
  await pool.end();
};
