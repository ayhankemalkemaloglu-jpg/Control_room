import { io, type Socket } from 'socket.io-client';
import { getApiBase, getAuthToken } from '../config';

/**
 * Connect to the Hermes Socket.io server. The backend authenticates the
 * handshake via `auth.token`, so a bad/empty token surfaces as a connect_error
 * with message "unauthorized".
 */
export function connectSocket(): Socket {
  return io(getApiBase(), {
    auth: { token: getAuthToken() },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });
}
