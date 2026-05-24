import { Router } from "express";

import { config } from "../config";
import { db } from "../db/connection";
import { bearerAuth } from "../middleware/auth";
import { getStats } from "../services/trades";

export const tradesRouter = Router();

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

tradesRouter.get("/trades/stats", bearerAuth(config.authToken), (req, res) => {
  const window = String(req.query.window ?? "all");
  res.json({ ok: true, stats: getStats(window) });
});

tradesRouter.get("/trades", bearerAuth(config.authToken), (req, res) => {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (req.query.status) {
    clauses.push("status = ?");
    params.push(String(req.query.status).toUpperCase());
  }
  if (req.query.symbol) {
    clauses.push("symbol = ?");
    params.push(String(req.query.symbol).toUpperCase());
  }

  const requested = Number.parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10);
  const limit = Math.min(
    Math.max(Number.isFinite(requested) ? requested : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const trades = db
    .prepare(
      `SELECT * FROM trades ${where} ORDER BY opened_at DESC, id DESC LIMIT ?`,
    )
    .all(...params, limit);

  res.json({ ok: true, count: trades.length, trades });
});
