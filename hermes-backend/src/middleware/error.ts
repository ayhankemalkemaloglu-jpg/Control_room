import type { NextFunction, Request, Response } from "express";

import { logger } from "../utils/logger";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "not_found" });
}

/** Express error handler. The 4-arg signature is required for Express to detect it. */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : "internal_error";
  logger.error({ err: message, path: req.path }, "request error");
  if (res.headersSent) return;
  res.status(500).json({ error: "internal_error" });
}

/** Wrap async handlers so rejected promises reach the error handler (Express 4). */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
