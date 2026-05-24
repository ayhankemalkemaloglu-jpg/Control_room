import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/hermes";

const WS_URL =
  process.env.NEXT_PUBLIC_HERMES_API_URL ??
  process.env.NEXT_PUBLIC_HERMES_WS_URL ??
  "http://localhost:4000";

const AUTH_TOKEN = process.env.NEXT_PUBLIC_HERMES_TOKEN ?? "";

export type HermesSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: HermesSocket | null = null;

/** Lazily-created, app-wide socket.io client. Connects on demand. */
export function getSocket(): HermesSocket {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      auth: {
        token: AUTH_TOKEN,
      },
    });
  }
  return socket;
}