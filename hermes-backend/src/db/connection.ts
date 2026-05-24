import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { config } from "../config";
import { logger } from "../utils/logger";

function ensureParentDir(target: string): void {
  if (target === ":memory:") return;
  try {
    mkdirSync(path.dirname(path.resolve(target)), { recursive: true });
  } catch {
    /* better-sqlite3 will surface a clear error if it truly can't open */
  }
}

ensureParentDir(config.dbPath);

export const db = new Database(config.dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

// Ensure the schema before any prepared statement is compiled elsewhere.
const schema = readFileSync(path.join(__dirname, "schema.sql"), "utf8");
db.exec(schema);

logger.info({ dbPath: config.dbPath }, "database ready, schema ensured");
