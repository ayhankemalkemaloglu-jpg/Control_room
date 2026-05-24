import { timingSafeEqual } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

/** Constant-time string comparison (avoids leaking token length-prefix via timing). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/** Express middleware factory enforcing a specific bearer token. */
export function bearerAuth(expectedToken: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = extractBearer(req.headers.authorization);
    if (!token || !safeEqual(token, expectedToken)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    next();
  };
}
