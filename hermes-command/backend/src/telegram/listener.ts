/**
 * Telegram listener — PLACEHOLDER (Phase 2).
 *
 * In Phase 2 this module will subscribe to the Hermes bot's Telegram channel,
 * parse incoming reports into `HourlyBriefing` / `TradeEvent` objects, and hand
 * them to the Socket.io broadcaster. For the Phase 1 skeleton it is intentionally
 * inert: nothing connects to Telegram and no credentials are read.
 */

import type { Server } from "socket.io";

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../types";

export interface TelegramListenerOptions {
  /** Bot token (TELEGRAM_BOT_TOKEN). Unused until Phase 2. */
  botToken?: string;
  /** Source channel / chat id to mirror. Unused until Phase 2. */
  channelId?: string;
}

/**
 * Wires the (future) Telegram source into the realtime layer.
 * No-op in Phase 1 — returns immediately without opening any connection.
 */
export function startTelegramListener(
  _io: Server<ClientToServerEvents, ServerToClientEvents>,
  _options: TelegramListenerOptions = {},
): void {
  // Phase 2: open the Telegram connection and translate messages into
  // briefings / trade events, then emit them via `_io`.
  console.info("[telegram] listener placeholder active — not connected (Phase 2)");
}
