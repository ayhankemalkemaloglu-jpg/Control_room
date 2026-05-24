import { readFileSync } from "node:fs";
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("production"),
  AUTH_TOKEN: z.string().min(1, "AUTH_TOKEN is required"),
  WEBHOOK_SECRET: z.string().min(1, "WEBHOOK_SECRET is required"),
  DB_PATH: z.string().min(1).default("./hermes.db"),
  LOG_PATH: z.string().min(1).default("./hermes.log"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  BINANCE_API_BASE: z.string().min(1).default("https://api.binance.com"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // The logger depends on config, so report directly and fail fast.
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

function readVersion(): string {
  try {
    const pkgPath = path.join(__dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const env = parsed.data;

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  isProd: env.NODE_ENV === "production",
  authToken: env.AUTH_TOKEN,
  webhookSecret: env.WEBHOOK_SECRET,
  dbPath: env.DB_PATH,
  logPath: env.LOG_PATH,
  corsOrigins: env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  binanceApiBase: env.BINANCE_API_BASE.replace(/\/+$/, ""),
  version: readVersion(),
} as const;

export type AppConfig = typeof config;
