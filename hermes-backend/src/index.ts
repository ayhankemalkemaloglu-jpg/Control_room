import { createServer } from "node:http";

import cors from "cors";
import express from "express";

import { config } from "./config";
import "./db/connection"; // opens the DB and ensures the schema before routes load
import { errorHandler, notFound } from "./middleware/error";
import { briefingsRouter } from "./routes/briefings";
import { healthRouter } from "./routes/health";
import { tradesRouter } from "./routes/trades";
import { webhookRouter } from "./routes/webhook";
import { initSocket } from "./socket/server";
import { logger } from "./utils/logger";

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: "256kb" }));

app.use(healthRouter);
app.use(webhookRouter);
app.use(briefingsRouter);
app.use(tradesRouter);

app.use(notFound);
app.use(errorHandler);

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(config.port, () => {
  logger.info(
    { port: config.port, env: config.nodeEnv, cors: config.corsOrigins },
    "hermes-backend listening",
  );
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err: err.message }, "uncaught exception — exiting");
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason: String(reason) }, "unhandled rejection — exiting");
  process.exit(1);
});
