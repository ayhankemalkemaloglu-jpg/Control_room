import { createServer } from "node:http";

import cors from "cors";
import express from "express";
import { Server } from "socket.io";

import { createMockBriefing } from "./mock/data";
import { startTelegramListener } from "./telegram/listener";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./types";

const PORT = Number(process.env.PORT ?? 4000);
const BRIEFING_INTERVAL_MS = Number(process.env.BRIEFING_INTERVAL_MS ?? 30_000);

// Browser origins allowed to reach the API / socket. Override with a
// comma-separated CLIENT_ORIGIN; the defaults already cover localhost and a
// custom `hermes.local` hostname (Windows hosts file), with or without :3000.
const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://hermes.local",
  "http://hermes.local:3000",
];
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : DEFAULT_ORIGINS;

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "hermes-backend",
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.info(`[socket] client connected: ${socket.id}`);

  // Push one briefing immediately so the panel is populated on connect,
  // then keep streaming a fresh mock briefing on a fixed cadence.
  socket.emit("briefing", createMockBriefing());

  const interval = setInterval(() => {
    socket.emit("briefing", createMockBriefing());
  }, BRIEFING_INTERVAL_MS);

  socket.on("disconnect", (reason) => {
    clearInterval(interval);
    console.info(`[socket] client disconnected: ${socket.id} (${reason})`);
  });
});

// Phase 2 hook — inert for now, opens no connection.
startTelegramListener(io);

httpServer.listen(PORT, () => {
  console.info(`[hermes] backend listening on http://localhost:${PORT}`);
  console.info(`[hermes] socket.io ready — briefing cadence ${BRIEFING_INTERVAL_MS}ms`);
  console.info(`[hermes] accepting client origins ${CLIENT_ORIGIN.join(", ")}`);
});
