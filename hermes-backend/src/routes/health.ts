import { Router } from "express";

import { config } from "../config";
import { db } from "../db/connection";
import { getLastBriefingTimestamp } from "../services/briefings";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  let dbOk = false;
  let lastBriefingAt: string | null = null;
  try {
    db.prepare("SELECT 1").get();
    dbOk = true;
    lastBriefingAt = getLastBriefingTimestamp();
  } catch {
    dbOk = false;
  }

  res.json({
    ok: true,
    uptime: process.uptime(),
    db_ok: dbOk,
    last_briefing_at: lastBriefingAt,
    version: config.version,
  });
});
