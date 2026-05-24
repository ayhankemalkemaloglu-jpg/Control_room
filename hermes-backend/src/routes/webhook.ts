import { Router } from "express";
import { z } from "zod";

import { config } from "../config";
import { db } from "../db/connection";
import { asyncHandler } from "../middleware/error";
import { bearerAuth } from "../middleware/auth";
import { parseBriefing } from "../parser/briefing";
import { saveBriefing } from "../services/briefings";
import { getStats, processDiff } from "../services/trades";
import { broadcast } from "../socket/server";
import { logger } from "../utils/logger";

export const webhookRouter = Router();

const BodySchema = z.object({
  message: z.string().min(10),
  timestamp: z.string().optional(),
});

const insertEvent = db.prepare(
  "INSERT INTO events (type, symbol, data_json) VALUES (?, ?, ?)",
);

webhookRouter.post(
  "/webhook/hermes",
  bearerAuth(config.webhookSecret),
  asyncHandler(async (req, res) => {
    const body = BodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({
        error: "invalid_body",
        details: body.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }

    const { message, timestamp } = body.data;

    let parsed;
    try {
      parsed = parseBriefing(message);
    } catch (err) {
      insertEvent.run(
        "PARSE_ERROR",
        null,
        JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
          raw: message,
        }),
      );
      logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        "briefing parse error",
      );
      res.status(200).json({ ok: false, error: "parse_failed" });
      return;
    }

    const { briefingId, timestamp: ts } = saveBriefing(parsed, message, timestamp);
    insertEvent.run(
      "BRIEFING_RECEIVED",
      null,
      JSON.stringify({
        briefingId,
        hourLabel: parsed.hourLabel,
        positions: parsed.positions.length,
      }),
    );

    const diff = await processDiff(briefingId, parsed.positions, ts);

    broadcast.briefingNew({ id: briefingId, timestamp: ts, ...parsed });
    for (const trade of diff.openedTrades) broadcast.tradeOpen(trade);
    for (const trade of diff.closedTrades) broadcast.tradeClose(trade);
    if (diff.closedCount > 0) broadcast.statsUpdate(getStats("all"));

    logger.info(
      {
        briefingId,
        opened: diff.openedCount,
        closed: diff.closedCount,
        positions: parsed.positions.length,
      },
      "webhook processed",
    );

    res.json({
      ok: true,
      briefing_id: briefingId,
      opened_count: diff.openedCount,
      closed_count: diff.closedCount,
      parsed,
    });
  }),
);
