import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { config } from "../config";
import { safeEqual } from "../middleware/auth";
import { logger } from "../utils/logger";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigins, methods: ["GET", "POST"] },
  });

  // Handshake auth: same token as the REST data routes (AUTH_TOKEN).
  io.use((socket, next) => {
    const raw = socket.handshake.auth?.token;
    const token = typeof raw === "string" ? raw.replace(/^Bearer\s+/i, "") : "";
    if (!token || !safeEqual(token, config.authToken)) {
      next(new Error("unauthorized"));
      return;
    }
    next();
  });

  io.on("connection", (socket) => {
    logger.info({ id: socket.id }, "socket connected");
    socket.on("disconnect", (reason) =>
      logger.info({ id: socket.id, reason }, "socket disconnected"),
    );
  });

  return io;
}

function emit(event: string, payload: unknown): void {
  io?.emit(event, payload);
}

export const broadcast = {
  briefingNew: (briefing: unknown) => emit("briefing:new", briefing),
  tradeOpen: (trade: unknown) => emit("trade:open", trade),
  tradeClose: (trade: unknown) => emit("trade:close", trade),
  statsUpdate: (stats: unknown) => emit("stats:update", stats),
};
