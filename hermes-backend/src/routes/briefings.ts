import { Router } from "express";

import { config } from "../config";
import { bearerAuth } from "../middleware/auth";
import { getRecentBriefings } from "../services/briefings";

export const briefingsRouter = Router();

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 168;

briefingsRouter.get("/briefings", bearerAuth(config.authToken), (req, res) => {
  const requested = Number.parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10);
  const limit = Math.min(
    Math.max(Number.isFinite(requested) ? requested : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const briefings = getRecentBriefings(limit);
  res.json({ ok: true, count: briefings.length, briefings });
});
