import { mkdirSync } from "node:fs";
import path from "node:path";

import pino from "pino";

import { config } from "../config";

function createLogger() {
  if (config.isProd) {
    try {
      mkdirSync(path.dirname(path.resolve(config.logPath)), { recursive: true });
    } catch {
      /* fall back to whatever pino can open */
    }
    return pino(
      { level: "info" },
      pino.destination({ dest: config.logPath, sync: false, mkdir: true }),
    );
  }

  return pino({
    level: "debug",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  });
}

export const logger = createLogger();
